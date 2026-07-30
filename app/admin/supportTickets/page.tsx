"use client";

import { Navbar } from "@/components/admin/Navbar";
import { useState } from "react";
import { TicketList } from "@/components/common/TicketList";
import { ChatWindow } from "@/components/common/ChatWindow";

export default function SupportTicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  return (
    <>
      <Navbar title="Support Tickets" />
      <main className="flex">
        {/* <TicketList
          tickets={[]}
          activeId={selectedTicket?.id}
          onSelect={setSelectedTicket}
        />
        <ChatWindow ticket={selectedTicket} /> */}
      </main>
    </>
  );
}
