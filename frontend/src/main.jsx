import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime : 30000,
      // One quick retry covers a blip; the default of 3 with back-off made
      // every failure feel like a long freeze.
      retry: 1,
    }
  }
})

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      {/* Toasts sit top-right so they never cover the bottom navigation / order buttons */}
      <SnackbarProvider
        autoHideDuration={2500}
        maxSnack={3}
        preventDuplicate
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <QueryClientProvider client={queryClient} >
          <App />
        </QueryClientProvider>
      </SnackbarProvider>
    </Provider>
  </StrictMode>
);
