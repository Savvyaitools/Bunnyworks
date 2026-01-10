import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  UserPlus, 
  Instagram, 
  ExternalLink,
  CheckCircle2,
  Image,
  Video,
  Heart,
  DollarSign,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { useOnlyFansAPI, DiscoveredCreator } from "@/hooks/useOnlyFansAPI";
import { useRecruitingCreators } from "@/hooks/useRecruitingCreators";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CreatorDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<DiscoveredCreator[]>([]);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  
  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [location, setLocation] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { searchCreators, loading } = useOnlyFansAPI();
  const { createRecruitingCreator } = useRecruitingCreators();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    const result = await searchCreators(searchQuery, {
      limit: 50,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 50 ? priceRange[1] : undefined,
      location: location || undefined,
      verified: verifiedOnly || undefined,
    });

    if (result) {
      setResults(result.data || []);
      setTotal(result.total || 0);
      setHasSearched(true);
    }
  }, [searchQuery, priceRange, location, verifiedOnly, searchCreators]);

  const handleAddToRecruiting = async (creator: DiscoveredCreator) => {
    setAddingIds(prev => new Set(prev).add(creator.id));
    
    try {
      await createRecruitingCreator({
        name: creator.name || creator.username,
        alias: creator.username,
        email: null,
        phone: null,
        source: "OnlyFans Discovery",
        status: "prospecting",
        notes: `OnlyFans: @${creator.username}\nSubscription: $${creator.subscribe_price}\nLocation: ${creator.location || 'Unknown'}\n\n${creator.about || ''}`.trim(),
        onboarded: false,
        country: creator.location || null,
      });
      toast.success(`Added ${creator.name || creator.username} to recruiting pipeline`);
    } catch (error) {
      toast.error("Failed to add to recruiting");
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev);
        next.delete(creator.id);
        return next;
      });
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price}/mo`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Creator Discovery</h1>
          <p className="text-muted-foreground mt-1">
            Search 3.5M+ OnlyFans creators to find potential recruits
          </p>
        </div>

        {/* Search Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Creators
            </CardTitle>
            <CardDescription>
              Find creators by name, niche, or location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username, niche, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {/* Filters */}
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                  {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Price Range */}
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Subscription Price: ${priceRange[0]} - ${priceRange[1] === 50 ? "50+" : priceRange[1]}
                    </Label>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      min={0}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., USA, UK, Miami"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  {/* Verified Only */}
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id="verified"
                      checked={verifiedOnly}
                      onCheckedChange={setVerifiedOnly}
                    />
                    <Label htmlFor="verified" className="text-sm cursor-pointer">
                      Verified creators only
                    </Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-24 w-full" />
                <CardContent className="pt-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-9 w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasSearched && results.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No creators found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search query or filters
              </p>
            </CardContent>
          </Card>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{total.toLocaleString()}</span> creators
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator}
                  onAdd={() => handleAddToRecruiting(creator)}
                  isAdding={addingIds.has(creator.id)}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          </>
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Search for Creators</h3>
              <p className="text-muted-foreground mt-1">
                Enter a keyword to discover OnlyFans creators for recruitment
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

interface CreatorCardProps {
  creator: DiscoveredCreator;
  onAdd: () => void;
  isAdding: boolean;
  formatPrice: (price: number) => string;
}

function CreatorCard({ creator, onAdd, isAdding, formatPrice }: CreatorCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur group">
      {/* Header Banner */}
      <div 
        className="h-20 bg-gradient-to-r from-primary/20 to-accent/20 relative"
        style={creator.header_url ? { backgroundImage: `url(${creator.header_url})`, backgroundSize: 'cover' } : {}}
      >
        {creator.is_verified && (
          <Badge className="absolute top-2 right-2 gap-1 bg-primary text-primary-foreground">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>

      <CardContent className="pt-0 -mt-8 relative">
        {/* Avatar */}
        <Avatar className="h-16 w-16 border-4 border-card ring-2 ring-primary/20">
          <AvatarImage src={creator.avatar_url} alt={creator.name} />
          <AvatarFallback className="bg-primary/20 text-primary text-lg">
            {creator.name?.charAt(0) || creator.username?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="mt-3 space-y-2">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">
              {creator.name || creator.username}
            </h3>
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatPrice(creator.subscribe_price)}
            </span>
            {creator.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {creator.location}
              </span>
            )}
          </div>

          {/* Content Stats */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Image className="h-3 w-3" />
              {creator.photos_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Video className="h-3 w-3" />
              {creator.videos_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-3 w-3" />
              {creator.favorites_count.toLocaleString()}
            </span>
          </div>

          {/* Bio */}
          {creator.about && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {creator.about}
            </p>
          )}

          {/* Social Links */}
          <div className="flex items-center gap-2 pt-1">
            {creator.instagram && (
              <a
                href={`https://instagram.com/${creator.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {creator.twitter && (
              <a
                href={`https://twitter.com/${creator.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {creator.tiktok && (
              <a
                href={`https://tiktok.com/@${creator.tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            )}
            <a
              href={`https://onlyfans.com/${creator.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors ml-auto"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Add Button */}
          <Button
            onClick={onAdd}
            disabled={isAdding}
            className="w-full mt-2 gap-2"
            size="sm"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Add to Recruiting
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
