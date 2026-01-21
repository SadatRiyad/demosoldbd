import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePageMeta } from "@/lib/usePageMeta";
import SiteSettingsPanel from "@/pages/admin/SiteSettingsPanel";
import DealsPanel from "@/pages/admin/DealsPanel";
import EarlyAccessPanel from "@/pages/admin/EarlyAccessPanel";

export default function AdminDashboard() {
  usePageMeta({ title: "Admin | sold.bd", description: "Admin dashboard for sold.bd." });
  const { signOut } = useAuth();

  return (
    <div className="bg-background">
      <section className="container py-10 md:py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Manage brand settings, deals, and signups.</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Log out
          </Button>
        </div>

        <Card className="mt-8 shadow-premium">
          <CardHeader>
            <CardTitle className="text-base">Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="site" className="w-full">
              <TabsList>
                <TabsTrigger value="site">Site</TabsTrigger>
                <TabsTrigger value="deals">Deals</TabsTrigger>
                <TabsTrigger value="signups">Early Access</TabsTrigger>
              </TabsList>
              <TabsContent value="site" className="mt-6">
                <SiteSettingsPanel />
              </TabsContent>
              <TabsContent value="deals" className="mt-6">
                <DealsPanel />
              </TabsContent>
              <TabsContent value="signups" className="mt-6">
                <EarlyAccessPanel />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
