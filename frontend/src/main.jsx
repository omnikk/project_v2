import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FilterProvider } from "./context/FilterContext";
import AppLayout from "./components/layout/AppLayout";
import Overview from "./pages/Overview";
import Dashboards from "./pages/Dashboards";
import Salons from "./pages/Salons";
import Services from "./pages/Services";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <FilterProvider>
        <AppLayout>
          <Routes>
            <Route path="/"           element={<Overview />} />
            <Route path="/dashboards" element={<Dashboards />} />
            <Route path="/salons"     element={<Salons />} />
            <Route path="/services"   element={<Services />} />
          </Routes>
        </AppLayout>
      </FilterProvider>
    </BrowserRouter>
  </React.StrictMode>
);