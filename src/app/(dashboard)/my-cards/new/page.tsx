"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui-migrated/button";
import { Input } from "@/components/ui-migrated/input";
import { Label } from "@/components/ui-migrated/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui-migrated/radio-group";
import { Textarea } from "@/components/ui-migrated/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui-migrated/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui-migrated/card";
import { toast } from "@/components/ui-migrated/use-toast";
import { createClientSideClient } from '@/lib/supabase/client-side';
import type { Database } from "@/lib/supabase/types"; // Import Database type
import { 
  PurchaseSource, 
  CardStatus, 
  SportType, 
  BuyingFormat, 
  LocationType, 
  GradingCompany 
} from "@/lib/supabase/types";
import { Upload, X, Image as ImageIcon, Search, CheckIcon, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui-migrated/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-migrated/popover";

interface FormData {
  name: string;
  player: string;
  sport: SportType | '';
  year: string;
  manufacturer: string;
  cardNumber: string;
  serialNumber: string;
  notes: string;
  grade: string;
  grading_company: GradingCompany | '';
  purchaseDate: string;
  purchase_price: string;
  status: CardStatus | '';
  source: PurchaseSource | '';
  targetPrice: string;
  watchlistNotes: string;
  current_value: string;
  selling_fees: string;
  grading_cost: string;
  sales_price: string;
  sales_date: string;
  date_shipped_to_grade: string;
  date_received_from_grade: string;
  taxes: string;
  shipping: string;
  buying_format: BuyingFormat | '';
  location: LocationType | '';
  purchase_link: string;
  image: File | null;
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

interface CardDataInsert {
  owner_id: string;
  name: string;
  player?: string | null;
  year: number;
  manufacturer?: string | null;
  sport?: SportType | null;
  is_watchlist: boolean;
  created_at: string;
  updated_at: string;
  status?: CardStatus | null;
  is_graded?: boolean | null;
  is_sold?: boolean | null;
  grade?: string | null;
  purchase_price?: number | null;
  source?: PurchaseSource | null;
  target_price?: number | null;
  watchlist_notes?: string | null;
  buying_format?: BuyingFormat | null;
  location?: LocationType | null;
  image_url?: string | null;
  purchase_link?: string | null;
  selling_fees?: number | null;
  grading_cost?: number | null;
  grading_returned_date?: string | null;
  grading_submission_date?: string | null;
  sale_price?: number | null;
  grading_company?: GradingCompany | null;
}

export default function AddCardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardType, setCardType] = useState<"inventory" | "watchlist">("inventory");
  const [clerkUserId, setClerkUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    player: "",
    sport: "",
    year: "",
    manufacturer: "",
    cardNumber: "",
    serialNumber: "",
    notes: "",
    grade: "Ungraded",
    grading_company: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    purchase_price: "",
    status: "Purchased",
    source: "",
    targetPrice: "",
    watchlistNotes: "",
    current_value: "",
    selling_fees: "",
    grading_cost: "",
    sales_price: "",
    sales_date: "",
    date_shipped_to_grade: "",
    date_received_from_grade: "",
    taxes: "",
    shipping: "",
    buying_format: "",
    location: "",
    purchase_link: "",
    image: null
  });

  const [playerOptions, setPlayerOptions] = useState<string[]>([]);
  const [manufacturerOptions, setManufacturerOptions] = useState<string[]>([]);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [manufacturerOpen, setManufacturerOpen] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        console.log('Syncing user with Clerk ID:', user.id);
        
        const response = await fetch('/api/users', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'sync' })
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
        
        if (!data.userId) { 
          console.error('Invalid data returned (missing userId):', data);
          throw new Error('Invalid user data returned from server');
        }
        
        console.log('User synced successfully, Clerk User ID:', data.userId);
        setClerkUserId(data.userId);
      } catch (error) {
        console.error('Error syncing user:', error);
        
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

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        if (!clerkUserId) return;
        
        const supabase = createClientSideClient();
        
        // Fetch unique player names from the user's cards
        const { data: players, error: playersError } = await supabase
          .from('cards')
          .select('player')
          .eq('owner_id', clerkUserId)
          .not('player', 'is', null);
        
        if (playersError) {
          console.error('Error fetching players:', playersError);
        } else if (players) {
          const uniquePlayers = Array.from(new Set(
            players
              .map(card => card.player)
              .filter(Boolean) as string[]
          ));
          setPlayerOptions(uniquePlayers);
        }
        
        // Fetch unique manufacturer names from the user's cards
        const { data: manufacturers, error: manufacturersError } = await supabase
          .from('cards')
          .select('manufacturer')
          .eq('owner_id', clerkUserId)
          .not('manufacturer', 'is', null);
        
        if (manufacturersError) {
          console.error('Error fetching manufacturers:', manufacturersError);
        } else if (manufacturers) {
          const uniqueManufacturers = Array.from(new Set(
            manufacturers
              .map(card => card.manufacturer)
              .filter(Boolean) as string[]
          ));
          setManufacturerOptions(uniqueManufacturers);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
    
    fetchOptions();
  }, [clerkUserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        throw new Error("You must be logged in to add a card");
      }

      if (!clerkUserId) { 
        throw new Error("Your account isn't fully set up yet. Please try again in a moment.");
      }

      console.log('Starting card submission. Clerk Owner ID:', clerkUserId);
      
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get authentication token: ${tokenResponse.status}`);
      }
      
      const { token } = await tokenResponse.json();
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      const supabase = createClientSideClient();
      
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      });
      
      const cardData: CardDataInsert = {
        owner_id: clerkUserId!,
        name: formData.name,
        player: formData.player || null,
        year: parseInt(formData.year) || 0,
        manufacturer: formData.manufacturer || null,
        sport: formData.sport as SportType || null,
        is_watchlist: cardType === "watchlist",
        created_at: formData.purchaseDate || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: cardType === "watchlist" ? "Watchlist" : (formData.status as CardStatus || "Purchased"),
        is_graded: formData.grade !== "Ungraded",
        is_sold: false,
        grade: formData.grade === "Ungraded" ? null : formData.grade,
        grading_company: formData.grading_company as GradingCompany || null,
        purchase_price: parseFloat(formData.purchase_price) || null,
        source: formData.source as PurchaseSource || null,
        target_price: parseFloat(formData.targetPrice) || null,
        watchlist_notes: formData.watchlistNotes || null,
        buying_format: formData.buying_format as BuyingFormat || null,
        location: formData.location as LocationType || null,
        purchase_link: formData.purchase_link || null,
        selling_fees: parseFloat(formData.selling_fees) || null,
        grading_cost: parseFloat(formData.grading_cost) || null,
        sale_price: parseFloat(formData.sales_price) || null,
        grading_returned_date: formData.date_received_from_grade || null,
        grading_submission_date: formData.date_shipped_to_grade || null,
      };

      console.log("Submitting card data:", cardData);
      
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
      
      // Handle image upload if an image was selected
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('cardId', insertedCard.id);
        imageFormData.append('image', formData.image);
        
        const imageResponse = await fetch('/api/upload-card-image', {
          method: 'POST',
          body: imageFormData,
        });
        
        if (!imageResponse.ok) {
          console.warn('Image upload failed, but card was created successfully');
          toast({
            title: "Card added",
            description: "Card created successfully, but image upload failed.",
          });
        } else {
          toast({
            title: "Success",
            description: "Card and image added successfully",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Card added successfully",
        });
      }

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
                  <Popover open={playerOpen} onOpenChange={setPlayerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={playerOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.player || "Select or enter player name"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search player name..."
                          onValueChange={(value: string) => {
                            if (value !== formData.player) {
                              handleSelectChange("player", value);
                            }
                          }}
                          value={formData.player}
                        />
                        <CommandEmpty>
                          {formData.player ? `Use "${formData.player}"` : "No player found."}
                        </CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {playerOptions.map((player) => (
                            <CommandItem
                              key={player}
                              value={player}
                              onSelect={() => {
                                handleSelectChange("player", player);
                                setPlayerOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={`mr-2 h-4 w-4 ${
                                  formData.player === player ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {player}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                  <Label htmlFor="manufacturer">Brand/Product</Label>
                  <Popover open={manufacturerOpen} onOpenChange={setManufacturerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={manufacturerOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.manufacturer || "Select or enter brand/product"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search brand/product..."
                          onValueChange={(value: string) => {
                            if (value !== formData.manufacturer) {
                              handleSelectChange("manufacturer", value);
                            }
                          }}
                          value={formData.manufacturer}
                        />
                        <CommandEmpty>
                          {formData.manufacturer ? `Use "${formData.manufacturer}"` : "No brand found."}
                        </CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {manufacturerOptions.map((manufacturer) => (
                            <CommandItem
                              key={manufacturer}
                              value={manufacturer}
                              onSelect={() => {
                                handleSelectChange("manufacturer", manufacturer);
                                setManufacturerOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={`mr-2 h-4 w-4 ${
                                  formData.manufacturer === manufacturer ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {manufacturer}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
            
            {cardType === "inventory" ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Purchase Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(CardStatus)
                            .filter(status => status !== "Watchlist")
                            .map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
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
                      <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                      <Input 
                        id="purchase_price" 
                        name="purchase_price" 
                        type="number" 
                        step="0.01" 
                        value={formData.purchase_price} 
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="buying_format">Buying Format</Label>
                      <Select 
                        value={formData.buying_format} 
                        onValueChange={(value) => handleSelectChange("buying_format", value)}
                      >
                        <SelectTrigger id="buying_format">
                          <SelectValue placeholder="Select buying format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Auction">Auction</SelectItem>
                          <SelectItem value="Buy_It_Now">Buy It Now</SelectItem>
                          <SelectItem value="Accepts_Offers">Accepts Offers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Select 
                        value={formData.location} 
                        onValueChange={(value) => handleSelectChange("location", value)}
                      >
                        <SelectTrigger id="location">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="North_America">North America</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="Worldwide">Worldwide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="current_value">Current Value ($)</Label>
                      <Input 
                        id="current_value" 
                        name="current_value" 
                        type="number" 
                        step="0.01" 
                        value={formData.current_value} 
                        onChange={handleChange} 
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="taxes">Taxes ($)</Label>
                      <Input 
                        id="taxes" 
                        name="taxes" 
                        type="number" 
                        step="0.01" 
                        value={formData.taxes} 
                        onChange={handleChange} 
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shipping">Shipping Cost ($)</Label>
                      <Input 
                        id="shipping" 
                        name="shipping" 
                        type="number" 
                        step="0.01" 
                        value={formData.shipping} 
                        onChange={handleChange} 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Grading Information</h3>
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
                      <Label htmlFor="grading_company">Grading Company</Label>
                      <Select 
                        value={formData.grading_company} 
                        onValueChange={(value) => handleSelectChange("grading_company", value as GradingCompany)}
                      >
                        <SelectTrigger id="grading_company">
                          <SelectValue placeholder="Select grading company" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(GradingCompany).map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="grading_cost">Grading Cost ($)</Label>
                      <Input 
                        id="grading_cost" 
                        name="grading_cost" 
                        type="number" 
                        step="0.01" 
                        value={formData.grading_cost} 
                        onChange={handleChange} 
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_shipped_to_grade">Date Shipped to Grade</Label>
                      <Input 
                        id="date_shipped_to_grade" 
                        name="date_shipped_to_grade" 
                        type="date" 
                        value={formData.date_shipped_to_grade} 
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_received_from_grade">Date Received from Grade</Label>
                      <Input 
                        id="date_received_from_grade" 
                        name="date_received_from_grade" 
                        type="date" 
                        value={formData.date_received_from_grade} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Sale Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sales_price">Sale Price ($)</Label>
                      <Input 
                        id="sales_price" 
                        name="sales_price" 
                        type="number" 
                        step="0.01" 
                        value={formData.sales_price} 
                        onChange={handleChange} 
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sales_date">Sale Date</Label>
                      <Input 
                        id="sales_date" 
                        name="sales_date" 
                        type="date" 
                        value={formData.sales_date} 
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="selling_fees">Selling Fees ($)</Label>
                      <Input 
                        id="selling_fees" 
                        name="selling_fees" 
                        type="number" 
                        step="0.01" 
                        value={formData.selling_fees} 
                        onChange={handleChange} 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </>
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
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Card Image</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardImage">Upload Card Image</Label>
                  <div className="flex items-center gap-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 w-full cursor-pointer hover:border-gray-400 transition-colors">
                      <input
                        id="cardImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label htmlFor="cardImage" className="cursor-pointer flex flex-col items-center justify-center">
                        {formData.image ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative h-40 w-40 mb-2">
                              <Image 
                                src={URL.createObjectURL(formData.image)} 
                                alt="Card preview" 
                                fill 
                                className="object-contain"
                              />
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="truncate max-w-[180px]">{formData.image.name}</span>
                              <span className="ml-1">({formatFileSize(formData.image.size)})</span>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setFormData(prev => ({ ...prev, image: null }));
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-20 w-20 bg-gray-100 rounded-md flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex items-center text-sm">
                              <Upload className="h-4 w-4 mr-1 text-gray-500" />
                              <span>Click to upload card image</span>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG or WEBP (max. 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purchase_link">Purchase Link</Label>
                  <Input 
                    id="purchase_link" 
                    name="purchase_link" 
                    value={formData.purchase_link} 
                    onChange={handleChange} 
                    placeholder="e.g. https://www.ebay.com/itm/123456789"
                  />
                </div>
              </div>
            </div>
            
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