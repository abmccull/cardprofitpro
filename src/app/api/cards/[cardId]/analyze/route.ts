import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { analyzeImage, detectCardText, detectCardQuality } from '@/lib/vision/client';

export async function POST(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get card details to ensure ownership
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', params.cardId)
      .eq('owner_id', session.user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Card not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get image URL from request body
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Run image analysis in parallel
    const [analysis, cardText, qualityAssessment] = await Promise.all([
      analyzeImage(imageUrl),
      detectCardText(imageUrl),
      detectCardQuality(imageUrl),
    ]);

    // Store analysis results
    const { error: insertError } = await supabase
      .from('card_analyses')
      .insert({
        card_id: params.cardId,
        image_url: imageUrl,
        detected_text: cardText,
        quality_assessment: qualityAssessment,
        vision_analysis: analysis,
        analyzed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing analysis results:', insertError);
      return NextResponse.json(
        { error: 'Failed to store analysis results' },
        { status: 500 }
      );
    }

    // Extract key insights
    const insights = {
      detectedText: cardText,
      quality: qualityAssessment.quality,
      qualityIssues: qualityAssessment.issues,
      confidence: qualityAssessment.confidence,
      detectedLabels: analysis.labels
        .filter(label => label.confidence > 0.7)
        .map(label => label.description),
      dominantColors: analysis.colors
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(color => color.rgb),
    };

    return NextResponse.json({
      data: {
        analysis,
        insights,
      },
    });
  } catch (error) {
    console.error('Error in image analysis route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 