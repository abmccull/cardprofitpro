import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { z } from 'zod';

const visionClient = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const visionResponseSchema = z.object({
  textAnnotations: z.array(z.object({
    description: z.string(),
    boundingPoly: z.object({
      vertices: z.array(z.object({
        x: z.number(),
        y: z.number(),
      })),
    }),
  })).optional(),
  labelAnnotations: z.array(z.object({
    description: z.string(),
    score: z.number(),
    topicality: z.number(),
  })).optional(),
  logoAnnotations: z.array(z.object({
    description: z.string(),
    score: z.number(),
  })).optional(),
  imagePropertiesAnnotation: z.object({
    dominantColors: z.object({
      colors: z.array(z.object({
        color: z.object({
          red: z.number(),
          green: z.number(),
          blue: z.number(),
        }),
        score: z.number(),
        pixelFraction: z.number(),
      })),
    }),
  }).optional(),
});

export type VisionAnalysisResult = {
  text: {
    description: string;
    boundingBox: {
      vertices: Array<{ x: number; y: number }>;
    };
  }[];
  labels: {
    description: string;
    confidence: number;
    relevance: number;
  }[];
  logos: {
    description: string;
    confidence: number;
  }[];
  colors: {
    rgb: {
      red: number;
      green: number;
      blue: number;
    };
    score: number;
    pixelFraction: number;
  }[];
};

export async function analyzeImage(imageUrl: string): Promise<VisionAnalysisResult> {
  try {
    const [result] = await visionClient.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION' },
        { type: 'LOGO_DETECTION' },
        { type: 'IMAGE_PROPERTIES' },
      ],
    });

    const validated = visionResponseSchema.parse(result);

    return {
      text: validated.textAnnotations?.map(text => ({
        description: text.description,
        boundingBox: {
          vertices: text.boundingPoly.vertices,
        },
      })) || [],
      labels: validated.labelAnnotations?.map(label => ({
        description: label.description,
        confidence: label.score,
        relevance: label.topicality,
      })) || [],
      logos: validated.logoAnnotations?.map(logo => ({
        description: logo.description,
        confidence: logo.score,
      })) || [],
      colors: validated.imagePropertiesAnnotation?.dominantColors.colors.map(color => ({
        rgb: color.color,
        score: color.score,
        pixelFraction: color.pixelFraction,
      })) || [],
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

export async function detectCardText(imageUrl: string): Promise<string[]> {
  try {
    const [result] = await visionClient.textDetection(imageUrl);
    const detections = result.textAnnotations || [];
    
    // The first element contains the entire text, subsequent elements are individual words
    return detections.slice(1).map((text: protos.google.cloud.vision.v1.IEntityAnnotation) => text.description || '');
  } catch (error) {
    console.error('Error detecting card text:', error);
    throw error;
  }
}

export async function detectCardQuality(imageUrl: string): Promise<{
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  confidence: number;
  issues: string[];
}> {
  try {
    const [result] = await visionClient.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 50 },
        { type: 'IMAGE_PROPERTIES' },
      ],
    });

    const issues: string[] = [];
    let qualityScore = 1.0;

    // Check image properties
    const properties = result.imagePropertiesAnnotation;
    if (properties?.dominantColors?.colors) {
      const avgBrightness = properties.dominantColors.colors.reduce((sum: number, color: protos.google.cloud.vision.v1.IColorInfo) => {
        const brightness = ((color.color?.red || 0) + (color.color?.green || 0) + (color.color?.blue || 0)) / 3;
        return sum + (brightness * (color.pixelFraction || 0));
      }, 0);

      if (avgBrightness < 50) {
        issues.push('Image is too dark');
        qualityScore *= 0.8;
      } else if (avgBrightness > 200) {
        issues.push('Image is too bright');
        qualityScore *= 0.8;
      }
    }

    // Check labels for quality issues
    const labels = result.labelAnnotations || [];
    const qualityIssues = labels.filter((label: protos.google.cloud.vision.v1.IEntityAnnotation) => 
      ['blur', 'blurry', 'damaged', 'worn', 'scratched', 'stained'].includes((label.description || '').toLowerCase())
    );

    qualityIssues.forEach((issue: protos.google.cloud.vision.v1.IEntityAnnotation) => {
      issues.push(`Detected ${(issue.description || '').toLowerCase()}`);
      qualityScore *= (1 - (issue.score || 0));
    });

    // Determine quality level based on score
    let quality: 'poor' | 'fair' | 'good' | 'excellent';
    if (qualityScore > 0.9) {
      quality = 'excellent';
    } else if (qualityScore > 0.7) {
      quality = 'good';
    } else if (qualityScore > 0.5) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    return {
      quality,
      confidence: qualityScore,
      issues,
    };
  } catch (error) {
    console.error('Error detecting card quality:', error);
    throw error;
  }
} 