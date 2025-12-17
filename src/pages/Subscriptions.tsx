import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BakongQRPayment } from "@/components/payment/BakongQRPayment";
import { useNavigate } from "react-router-dom";

export default function Subscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: currentSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ["user-subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-payment", {
        body: { planId: plan.id },
      });

      if (error) throw error;

      setSelectedPlan(plan);
      setPaymentData(data);
      setShowPayment(true);
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = () => {
    refetchSubscription();
    toast({
      title: "Subscription Active",
      description: "Your VIP subscription is now active!",
    });
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your VIP Plan</h1>
        <p className="text-muted-foreground text-lg">
          Unlock unlimited access to premium content
        </p>
      </div>

      {currentSubscription && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">
                  {currentSubscription.subscription_plans?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Active until {new Date(currentSubscription.end_date).toLocaleDateString()}
                </p>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan) => {
          const features = Array.isArray(plan.features) ? plan.features : [];
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative ${isCurrentPlan ? "border-primary" : ""}`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary">Current Plan</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-4xl font-bold">${plan.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.duration_days} days
                  </div>
                </div>

                <ul className="space-y-2">
                  {features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan}
                  className="w-full"
                >
                  {isCurrentPlan ? "Current Plan" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {paymentData && (
        <BakongQRPayment
          open={showPayment}
          onOpenChange={setShowPayment}
          transactionId={paymentData.transactionId}
          qrData={paymentData.qrData}
          amount={selectedPlan?.price || 0}
          onSuccess={handlePaymentSuccess}
          verificationType="subscription"
        />
      )}
    </div>
  );
}
