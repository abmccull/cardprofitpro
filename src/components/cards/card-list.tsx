import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CardList({ cards, type }) {
  if (!cards.length) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <p className="text-muted-foreground">
          {type === "inventory" 
            ? "You haven't added any cards to your collection yet." 
            : "You haven't added any cards to your watchlist yet."}
        </p>
        <Link 
          href="/my-cards/new" 
          className="text-primary hover:underline mt-2 inline-block"
        >
          Add your first card
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(card => (
        <Card key={card.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium truncate">{card.name}</h3>
              {card.grade && card.grade !== "Ungraded" && (
                <Badge variant="outline">{card.grade}</Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mb-4">
              <p>
                {card.year} {card.manufacturer}{" "}
                {card.sport && <span className="capitalize">({card.sport})</span>}
              </p>
            </div>
            
            {type === "inventory" ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Date Added:</p>
                  <p>{formatDate(card.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchase Price:</p>
                  <p>{formatCurrency(card.purchase_price)}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 text-sm">
                {card.target_price && (
                  <div>
                    <p className="text-muted-foreground">Target Price:</p>
                    <p>{formatCurrency(card.target_price)}</p>
                  </div>
                )}
                {card.watchlist_notes && (
                  <div>
                    <p className="text-muted-foreground">Notes:</p>
                    <p className="truncate">{card.watchlist_notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="bg-gray-50 p-3 border-t">
            <Link 
              href={`/my-cards/${card.id}`}
              className="text-sm text-primary hover:underline w-full text-center"
            >
              View Details
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 