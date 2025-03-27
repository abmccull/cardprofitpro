"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { createClientSideClient } from '@/lib/supabase/client-side';
import { PurchaseSource } from "@/lib/supabase/types";

interface FormData {
  name: string;
  player: string;
  sport: string;
  year: string;
  brand: string;
  cardNumber: string;
  serialNumber: string;
  notes: string;
  grade: string;
  purchaseDate: string;
  purchasePrice: string;
  source: PurchaseSource | '';
  targetPrice: string;
  watchlistNotes: string;
}

interface CardData {
  owner_id: string | undefined;
  name: string;
  player: string;
  year: number;
  manufacturer: string;
  sport: string;
  grade?: string;
  purchase_price?: number;
  status?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  is_graded?: boolean;
  is_watchlist: boolean;
  target_price?: number;
  watchlist_notes?: string;
  is_sold: boolean;
  source?: PurchaseSource;
}

export default function AddCardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardType, setCardType] = useState<"inventory" | "watchlist">("inventory");
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    player: "",
    sport: "",
    year: "",
    brand: "",
    cardNumber: "",
    serialNumber: "",
    notes: "",
    grade: "Ungraded",
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: "",
    source: "",
    targetPrice: "",
    watchlistNotes: ""
  });

  useEffect(() => {
    const syncUser = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        console.log('Syncing user with Clerk ID:', user.id);
        
        const response = await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clerkId: user.id })
        });
        
        const responseText = await response.text();
        let data;
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', responseText);
          throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
          console.error('Error response from API:', data);
          throw new Error(data.error || 'Failed to sync user');
        }
        
        if (!data.success || !data.data?.id) {
          console.error('Invalid data returned:', data);
          throw new Error('Invalid user data returned from server');
        }
        
        console.log('User synced successfully, Supabase ID:', data.data.id);
        setSupabaseUserId(data.data.id);
      } catch (error) {
        console.error('Error syncing user:', error);
        
        // Show a more descriptive error message
        let errorMessage = 'Failed to prepare your account. Please try refreshing the page.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      syncUser();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        throw new Error("You must be logged in to add a card");
      }

      if (!supabaseUserId) {
        throw new Error("Your account isn't fully set up yet. Please try again in a moment.");
      }

      console.log('Starting card submission. Owner ID:', supabaseUserId);
      
      // Get Clerk token for Supabase
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get authentication token: ${tokenResponse.status}`);
      }
      
      const { token } = await tokenResponse.json();
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // Initialize Supabase client with auth headers
      const supabase = createClientSideClient();
      
      // Set the auth token
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      });
      
      const cardData: CardData = {
        owner_id: supabaseUserId,
        name: formData.name,
        player: formData.player,
        year: parseInt(formData.year),
        manufacturer: formData.brand,
        sport: formData.sport,
        is_watchlist: cardType === "watchlist",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: cardType === "inventory" ? "raw" : undefined,
        is_graded: false,
        is_sold: false
      };
      
      if (cardType === "inventory") {
        cardData.grade = formData.grade;
        cardData.is_graded = formData.grade !== "Ungraded";
        cardData.purchase_price = parseFloat(formData.purchasePrice) || 0;
        cardData.source = formData.source || undefined;
        if (cardData.is_graded) {
          cardData.status = "graded";
        }
      } else {
        cardData.target_price = parseFloat(formData.targetPrice) || 0;
        cardData.watchlist_notes = formData.watchlistNotes;
      }

      console.log("Submitting card data:", cardData);
      
      // Insert the card directly without user verification
      const { data: insertedCard, error: insertError } = await supabase
        .from('cards')
        .insert([cardData])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting card:', insertError);
        throw new Error(`Failed to add card: ${insertError.message}`);
      }

      console.log('Card added successfully:', insertedCard);
      
      toast({
        title: "Success",
        description: "Card added to your collection",
      });

      router.push('/my-cards');
    } catch (error) {
      console.error('Error adding card:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add card",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Card</CardTitle>
          <CardDescription>
            Add a card to your collection or watchlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Card Type Selection */}
            <div className="mb-6">
              <Label className="text-base font-medium">Where would you like to add this card?</Label>
              <RadioGroup 
                className="flex gap-4 mt-2" 
                value={cardType} 
                onValueChange={(value: "inventory" | "watchlist") => setCardType(value)}
                defaultValue="inventory"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inventory" id="inventory" />
                  <Label htmlFor="inventory">Add to My Collection</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="watchlist" id="watchlist" />
                  <Label htmlFor="watchlist">Add to Watchlist</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Common Card Details */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Card Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Card Name/Title</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. 2021 Topps Chrome Shohei Ohtani"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="player">Player Name</Label>
                  <Input 
                    id="player" 
                    name="player" 
                    value={formData.player} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Shohei Ohtani"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport</Label>
                  <Select 
                    value={formData.sport} 
                    onValueChange={(value) => handleSelectChange("sport", value)}
                  >
                    <SelectTrigger id="sport">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baseball">Baseball</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                      <SelectItem value="Football">Football</SelectItem>
                      <SelectItem value="Hockey">Hockey</SelectItem>
                      <SelectItem value="Soccer">Soccer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input 
                    id="year" 
                    name="year" 
                    type="number" 
                    value={formData.year} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. 2021"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand/Product</Label>
                  <Input 
                    id="brand" 
                    name="brand" 
                    value={formData.brand} 
                    onChange={handleChange} 
                    placeholder="e.g. Topps Chrome"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input 
                    id="cardNumber" 
                    name="cardNumber" 
                    value={formData.cardNumber} 
                    onChange={handleChange} 
                    placeholder="e.g. #150"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number (if applicable)</Label>
                  <Input 
                    id="serialNumber" 
                    name="serialNumber" 
                    value={formData.serialNumber} 
                    onChange={handleChange} 
                    placeholder="e.g. 42/99"
                  />
                </div>
              </div>
            </div>
            
            {/* Conditional Fields Based on Card Type */}
            {cardType === "inventory" ? (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select 
                      value={formData.grade} 
                      onValueChange={(value) => handleSelectChange("grade", value)}
                    >
                      <SelectTrigger id="grade">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="Ungraded">Ungraded</SelectItem>
                        <SelectItem value="PSA 10">PSA 10</SelectItem>
                        <SelectItem value="PSA 9.5">PSA 9.5</SelectItem>
                        <SelectItem value="PSA 9">PSA 9</SelectItem>
                        <SelectItem value="PSA 8.5">PSA 8.5</SelectItem>
                        <SelectItem value="PSA 8">PSA 8</SelectItem>
                        <SelectItem value="PSA 7.5">PSA 7.5</SelectItem>
                        <SelectItem value="PSA 7">PSA 7</SelectItem>
                        <SelectItem value="PSA 6">PSA 6</SelectItem>
                        <SelectItem value="PSA 5">PSA 5</SelectItem>
                        <SelectItem value="PSA 4">PSA 4</SelectItem>
                        <SelectItem value="PSA 3">PSA 3</SelectItem>
                        <SelectItem value="PSA 2">PSA 2</SelectItem>
                        <SelectItem value="PSA 1">PSA 1</SelectItem>
                        <SelectItem value="BGS 10">BGS 10 (Pristine)</SelectItem>
                        <SelectItem value="BGS 9.5">BGS 9.5 (Gem Mint)</SelectItem>
                        <SelectItem value="BGS 9">BGS 9 (Mint)</SelectItem>
                        <SelectItem value="BGS 8.5">BGS 8.5</SelectItem>
                        <SelectItem value="BGS 8">BGS 8</SelectItem>
                        <SelectItem value="BGS 7.5">BGS 7.5</SelectItem>
                        <SelectItem value="BGS 7">BGS 7</SelectItem>
                        <SelectItem value="SGC 10">SGC 10 (Pristine)</SelectItem>
                        <SelectItem value="SGC 9.5">SGC 9.5</SelectItem>
                        <SelectItem value="SGC 9">SGC 9</SelectItem>
                        <SelectItem value="SGC 8.5">SGC 8.5</SelectItem>
                        <SelectItem value="SGC 8">SGC 8</SelectItem>
                        <SelectItem value="SGC 7.5">SGC 7.5</SelectItem>
                        <SelectItem value="SGC 7">SGC 7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input 
                      id="purchaseDate" 
                      name="purchaseDate" 
                      type="date" 
                      value={formData.purchaseDate} 
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input 
                      id="purchasePrice" 
                      name="purchasePrice" 
                      type="number" 
                      step="0.01" 
                      value={formData.purchasePrice} 
                      onChange={handleChange} 
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select 
                      value={formData.source} 
                      onValueChange={(value) => handleSelectChange("source", value as PurchaseSource)}
                    >
                      <SelectTrigger id="source">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PurchaseSource).map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Watchlist Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetPrice">Target Price ($)</Label>
                    <Input 
                      id="targetPrice" 
                      name="targetPrice" 
                      type="number" 
                      step="0.01" 
                      value={formData.targetPrice} 
                      onChange={handleChange} 
                      required
                      placeholder="e.g. 25.99"
                    />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="watchlistNotes">Watchlist Notes</Label>
                    <Textarea 
                      id="watchlistNotes" 
                      name="watchlistNotes" 
                      value={formData.watchlistNotes} 
                      onChange={handleChange} 
                      placeholder="Why you're watching this card, market trends, etc."
                      className="min-h-20"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/my-cards')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Adding...' : 'Add Card'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 