
"use client";

import { Settings as SettingsIcon, Image as ImageIcon, Palette, MapPin, FileText, Landmark } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  featureKey: string; 
}

const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary flex-shrink-0" />
          <CardTitle className="text-lg font-semibold leading-snug">{title}</CardTitle>
        </div>
        <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-500/10 whitespace-nowrap">Premium</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button variant="secondary" disabled className="w-full sm:w-auto text-xs sm:text-sm">
          Learn More (Premium)
        </Button>
      </CardContent>
    </Card>
  );
};

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser === null) { 
      router.replace("/");
    }
  }, [currentUser, router]);

  if (currentUser === undefined) { 
    return (
      <>
        <GlobalPreloaderScreen message="Loading settings..." />
      </>
    );
  }
  if (currentUser === null) { 
     return (
      <>
        <GlobalPreloaderScreen message="Redirecting..." />
      </>
     );
  }

  const premiumFeatures: PremiumFeatureCardProps[] = [
    {
      title: "Customize System Logo",
      description: "Personalize the application with your business logo in the sidebar and on receipts.",
      icon: ImageIcon,
      featureKey: "logo_customization",
    },
    {
      title: "Application Color Theme",
      description: "Tailor the application's color scheme to match your unique brand identity.",
      icon: Palette,
      featureKey: "theme_customization",
    },
    {
      title: "Business Information",
      description: "Update your business address, contact numbers, and other details for invoices.",
      icon: MapPin,
      featureKey: "business_info_edit",
    },
    {
      title: "Invoice Customization",
      description: "Modify the layout, fields, and branding of your sales invoices and receipts.",
      icon: FileText,
      featureKey: "invoice_template_edit",
    },
    {
      title: "Bank Deposit Management",
      description: "Track and manage records of bank deposits directly within the application.",
      icon: Landmark,
      featureKey: "bank_deposit_management",
    },
  ];

  return (
    <>
      <PageHeader
        title="Application Settings"
        description="Manage preferences and explore premium features for N Group Products."
        icon={SettingsIcon}
      />

      <div className="space-y-8">
        <Card className="shadow-lg border-yellow-500/50 bg-yellow-500/5 dark:bg-yellow-700/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-yellow-700 dark:text-yellow-400">Unlock Premium Features</CardTitle>
            <CardDescription className="text-yellow-800/90 dark:text-yellow-300/90">
              The features listed below are part of our exclusive premium package. Elevate your N Group Products experience by unlocking these advanced capabilities.
              To activate these functions for your current edition, please contact <strong className="font-semibold text-primary dark:text-primary-foreground/90">Limidora</strong>.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {premiumFeatures.map((feature) => (
            <PremiumFeatureCard
              key={feature.featureKey}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              featureKey={feature.featureKey}
            />
          ))}
        </div>
        
        <div className="text-center text-sm text-muted-foreground mt-10 pt-6 border-t">
            <p>For inquiries about premium features or to discuss upgrading your plan, please do not hesitate to contact Limidora support.</p>
            <p className="mt-1">You can reach out to <strong className="text-primary">Limidora</strong> through your account representative.</p>
        </div>
      </div>
    </>
  );
}
