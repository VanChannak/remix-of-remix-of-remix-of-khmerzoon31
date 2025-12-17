import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/public/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Play, Receipt } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';

interface Rental {
  id: string;
  media_id: string;
  media_type: 'movie' | 'series' | 'anime';
  rental_price: number;
  start_date: string;
  end_date: string;
  payment_status: string;
  created_at: string;
  media?: {
    title: string;
    thumbnail: string;
    tmdb_id?: string;
  };
}

export default function RentalHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchRentals();
  }, [user]);

  const fetchRentals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: rentalsData, error } = await supabase
        .from('user_rentals')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch media details for each rental
      const rentalsWithMedia = await Promise.all(
        (rentalsData || []).map(async (rental) => {
          let media = null;
          
          if (rental.media_type === 'movie') {
            const { data } = await supabase
              .from('movies')
              .select('title, thumbnail, tmdb_id')
              .eq('id', rental.media_id)
              .maybeSingle();
            media = data;
          } else if (rental.media_type === 'series') {
            const { data } = await supabase
              .from('series')
              .select('title, thumbnail, tmdb_id')
              .eq('id', rental.media_id)
              .maybeSingle();
            media = data;
          } else if (rental.media_type === 'anime') {
            const { data } = await supabase
              .from('animes')
              .select('title, thumbnail, tmdb_id')
              .eq('id', rental.media_id)
              .maybeSingle();
            media = data;
          }

          return {
            ...rental,
            media_type: rental.media_type as 'movie' | 'series' | 'anime',
            media,
          };
        })
      );

      setRentals(rentalsWithMedia);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (rental: Rental) => {
    return !isPast(new Date(rental.end_date));
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const activeRentals = rentals.filter(isActive);
  const expiredRentals = rentals.filter(rental => !isActive(rental));

  const handleWatch = (rental: Rental) => {
    if (rental.media_type === 'movie' && rental.media?.tmdb_id) {
      navigate(`/watch/movie/${rental.media.tmdb_id}`);
    } else if (rental.media_type === 'series' && rental.media?.tmdb_id) {
      navigate(`/watch/series/${rental.media.tmdb_id}/1/1`);
    } else if (rental.media_type === 'anime') {
      navigate(`/anime/${rental.media_id}`);
    }
  };

  const RentalCard = ({ rental }: { rental: Rental }) => {
    const active = isActive(rental);
    const daysRemaining = getDaysRemaining(rental.end_date);

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3">
            <img
              src={rental.media?.thumbnail || '/placeholder.svg'}
              alt={rental.media?.title || 'Media'}
              className="w-full h-48 md:h-full object-cover"
            />
          </div>
          <CardContent className="md:w-2/3 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{rental.media?.title || 'Unknown Title'}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={active ? 'default' : 'secondary'}>
                    {active ? 'Active' : 'Expired'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {rental.media_type}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">${rental.rental_price}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Rented: {format(new Date(rental.start_date || rental.created_at), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {active 
                    ? `Expires: ${format(new Date(rental.end_date), 'MMM dd, yyyy')} (${daysRemaining} days left)`
                    : `Expired: ${format(new Date(rental.end_date), 'MMM dd, yyyy')}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Receipt className="w-4 h-4" />
                <span>Transaction ID: {rental.id.slice(0, 8)}...</span>
              </div>
            </div>

            {active && (
              <Button 
                onClick={() => handleWatch(rental)}
                className="w-full md:w-auto"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Now
              </Button>
            )}
          </CardContent>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Rental History</h1>
            <p className="text-muted-foreground">
              View all your active and past rentals
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'expired')}>
            <TabsList className="mb-6">
              <TabsTrigger value="active">
                Active Rentals ({activeRentals.length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired Rentals ({expiredRentals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeRentals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Active Rentals</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any active rentals at the moment
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Browse Content
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                activeRentals.map(rental => (
                  <RentalCard key={rental.id} rental={rental} />
                ))
              )}
            </TabsContent>

            <TabsContent value="expired" className="space-y-4">
              {expiredRentals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Expired Rentals</h3>
                    <p className="text-muted-foreground">
                      You don't have any expired rentals yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                expiredRentals.map(rental => (
                  <RentalCard key={rental.id} rental={rental} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
