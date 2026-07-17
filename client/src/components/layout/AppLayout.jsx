import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default AppLayout;