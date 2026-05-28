import { useState } from "react";
import Sidebar from "../components/Sidebar";
import NavBar from "../components/NavBar";

function Layout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">

      {/* 🔥 SIDEBAR */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* 🔥 CONTENIDO */}
      <div className="flex-1 flex flex-col">

        <NavBar setOpen={setOpen} />

        <main className="p-4 md:p-6">
          {children}
        </main>

      </div>

    </div>
  );
}

export default Layout;