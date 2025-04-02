import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import crypto from 'crypto';

// Generate a UUID for file names
function generateUUID() {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    const userId = session.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to upload an image' }, 
        { status: 401 }
      );
    }

    // Get form data from the request
    const formData = await request.formData();
    const cardId = formData.get('cardId') as string;
    const imageFile = formData.get('image') as File;

    if (!cardId) {
      return NextResponse.json(
        { error: 'Missing card ID' }, 
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' }, 
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' }, 
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be less than 5MB' }, 
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { path: string; maxAge: number; domain?: string }) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: { path: string; domain?: string }) {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          },
        },
      }
    );

    // Verify card belongs to the user
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('id, owner_id')
      .eq('id', cardId)
      .single();
    
    if (cardError || !cardData) {
      return NextResponse.json(
        { error: 'Card not found' }, 
        { status: 404 }
      );
    }
    
    if (cardData.owner_id !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to update this card' }, 
        { status: 403 }
      );
    }

    // Convert the file to a buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process the image to create a thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .toBuffer();

    // Generate unique file names
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const uniqueImageName = `${generateUUID()}.${fileExtension}`;
    const uniqueThumbnailName = `thumb_${generateUUID()}.${fileExtension}`;
    
    // Upload original image to Supabase Storage
    const { data: imageData, error: imageError } = await supabase.storage
      .from('card-images')
      .upload(`${userId}/${uniqueImageName}`, buffer, {
        contentType: imageFile.type,
        cacheControl: '3600',
      });
    
    if (imageError) {
      console.error('Error uploading image:', imageError);
      return NextResponse.json(
        { error: 'Failed to upload image' }, 
        { status: 500 }
      );
    }
    
    // Upload thumbnail to Supabase Storage
    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
      .from('card-images')
      .upload(`${userId}/thumbnails/${uniqueThumbnailName}`, thumbnailBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });
    
    // Get public URLs
    const { data: imageUrl } = supabase.storage
      .from('card-images')
      .getPublicUrl(`${userId}/${uniqueImageName}`);
      
    let thumbnailUrl = null;
    if (!thumbnailError) {
      const { data: thumbUrl } = supabase.storage
        .from('card-images')
        .getPublicUrl(`${userId}/thumbnails/${uniqueThumbnailName}`);
      thumbnailUrl = thumbUrl.publicUrl;
    }
    
    // Update the card record with the image URLs
    const { error: updateError } = await supabase
      .from('cards')
      .update({
        image_url: imageUrl.publicUrl,
        thumbnail_url: thumbnailUrl || imageUrl.publicUrl, // Use main image as fallback
      })
      .eq('id', cardId);
    
    if (updateError) {
      console.error('Error updating card with image URLs:', updateError);
      return NextResponse.json(
        { error: 'Failed to update card with image URLs' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: imageUrl.publicUrl,
      thumbnailUrl: thumbnailUrl || imageUrl.publicUrl
    });
    
  } catch (error) {
    console.error('Error handling image upload:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 