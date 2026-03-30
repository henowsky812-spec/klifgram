import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import Stars from "@/pages/stars";
import NftPage from "@/pages/nft";
import Numbers from "@/pages/numbers";
import Cases from "@/pages/cases";
import Admin from "@/pages/admin";
import Marketplace from "@/pages/marketplace";
import Shop from "@/pages/shop";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/" component={Home} />
      <Route path="/chat/:userId" component={Chat} />
      <Route path="/profile/:username" component={Profile} />
      <Route path="/stars" component={Stars} />
      <Route path="/nft" component={NftPage} />
      <Route path="/numbers" component={Numbers} />
      <Route path="/cases" component={Cases} />
      <Route path="/admin" component={Admin} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/shop" component={Shop} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
