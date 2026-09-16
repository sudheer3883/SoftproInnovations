import { useEffect, useMemo, useState } from "react";
import "./Complaints.css";

const initialTickets = [
  {
    id: "TKT-890",
    customer: "Rahul Sharma",
    email: "rahul.sharma@email.com",
    subject: "Order #ORD-9083 delayed",
    date: "Oct 25, 2026",
    priority: "High",
    status: "Open",
    message:
      "My order was expected yesterday, but the tracking page has not changed since dispatch.",
  },
  {
    id: "TKT-891",
    customer: "Priya Singh",
    email: "priya.singh@email.com",
    subject: "Received wrong sensor module",
    date: "Oct 25, 2026",
    priority: "Medium",
    status: "Open",
    message:
      "The delivered module is different from the one shown in my order confirmation.",
  },
  {
    id: "TKT-885",
    customer: "Vikram Singh",
    email: "vikram.singh@email.com",
    subject: "Invoice request for bulk order",
    date: "Oct 22, 2026",
    priority: "Low",
    status: "Resolved",
    message: "Please share the GST invoice for our bulk purchase.",
  },
];

const storageKey = "softpro-admin-complaints";

const Complaints = () => {
  const [tickets, setTickets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || initialTickets;
    } catch {
      return initialTickets;
    }
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tickets));
  }, [tickets]);

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const searchable =
          `${ticket.id} ${ticket.customer} ${ticket.subject}`.toLowerCase();
        return (
          searchable.includes(query.toLowerCase()) &&
          (statusFilter === "All" || ticket.status === statusFilter)
        );
      }),
    [query, statusFilter, tickets],
  );

  const openCount = tickets.filter((ticket) => ticket.status === "Open").length;
  const highPriorityCount = tickets.filter(
    (ticket) => ticket.priority === "High" && ticket.status !== "Resolved",
  ).length;

  const updateTicket = (id, changes) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === id ? { ...ticket, ...changes } : ticket,
      ),
    );
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const handleReply = (event) => {
    event.preventDefault();
    if (!reply.trim() || !selectedTicket) return;
    updateTicket(selectedTicket.id, { status: "In Progress" });
    setReply("");
    setSelectedTicket(null);
    showNotice(`Reply saved for #${selectedTicket.id}`);
  };

  return (
    <section className="complaints-page">
      <header className="complaints-hero">
        <div>
          <span className="complaints-kicker">SUPPORT DESK / LIVE QUEUE</span>
          <h1 className="dashboard-header-title">
            Customer <span>Complaints</span>
          </h1>
          <p>Keep every customer conversation moving and visible.</p>
        </div>
        <button
          className="complaints-reset"
          type="button"
          onClick={() => {
            setTickets(initialTickets);
            showNotice("Ticket queue restored");
          }}
        >
          <i className="bi bi-arrow-counterclockwise" /> Reset demo data
        </button>
      </header>

      {notice && (
        <div className="complaints-notice" role="status">
          <i className="bi bi-check-circle-fill" /> {notice}
        </div>
      )}

      <div className="complaint-stats" aria-label="Complaint summary">
        <article>
          <span className="complaint-stat-icon blue">
            <i className="bi bi-inbox-fill" />
          </span>
          <div>
            <small>Total tickets</small>
            <strong>{tickets.length}</strong>
          </div>
        </article>
        <article>
          <span className="complaint-stat-icon amber">
            <i className="bi bi-clock-history" />
          </span>
          <div>
            <small>Needs attention</small>
            <strong>{openCount}</strong>
          </div>
        </article>
        <article>
          <span className="complaint-stat-icon red">
            <i className="bi bi-exclamation-triangle-fill" />
          </span>
          <div>
            <small>High priority</small>
            <strong>{highPriorityCount}</strong>
          </div>
        </article>
        <article>
          <span className="complaint-stat-icon green">
            <i className="bi bi-check2-circle" />
          </span>
          <div>
            <small>Resolved</small>
            <strong>
              {tickets.filter((ticket) => ticket.status === "Resolved").length}
            </strong>
          </div>
        </article>
      </div>

      <div className="complaints-panel">
        <div className="complaints-toolbar">
          <div>
            <h2>
              Ticket queue <span>{filteredTickets.length}</span>
            </h2>
            <p>Search, filter, and respond without leaving this view.</p>
          </div>
          <div className="complaints-controls">
            <label className="complaints-search">
              <i className="bi bi-search" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tickets..."
                aria-label="Search tickets"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter tickets by status"
            >
              <option>All</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
        </div>
        <div className="complaints-table-wrap">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <strong>#{ticket.id}</strong>
                    </td>
                    <td>
                      <strong className="customer-name">
                        {ticket.customer}
                      </strong>
                      <small>{ticket.email}</small>
                    </td>
                    <td>{ticket.subject}</td>
                    <td>{ticket.date}</td>
                    <td>
                      <span
                        className={`ticket-badge priority-${ticket.priority.toLowerCase()}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`ticket-badge status-${ticket.status.toLowerCase().replace(" ", "-")}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="ticket-action"
                        type="button"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setReply("");
                        }}
                      >
                        {ticket.status === "Resolved" ? "View" : "Respond"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="complaints-empty">
                    <i className="bi bi-search" />
                    <strong>No tickets found</strong>
                    <span>Try a different search or status filter.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTicket && (
        <div
          className="complaint-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedTicket(null);
          }}
        >
          <div
            className="complaint-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-modal-title"
          >
            <div className="complaint-modal-header">
              <div>
                <span>#{selectedTicket.id}</span>
                <h2 id="complaint-modal-title">{selectedTicket.subject}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedTicket(null)}
                aria-label="Close ticket"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="complaint-modal-meta">
              <span>
                <i className="bi bi-person" /> {selectedTicket.customer}
              </span>
              <span>
                <i className="bi bi-envelope" /> {selectedTicket.email}
              </span>
              <span
                className={`ticket-badge status-${selectedTicket.status.toLowerCase().replace(" ", "-")}`}
              >
                {selectedTicket.status}
              </span>
            </div>
            <p className="complaint-message">{selectedTicket.message}</p>
            {selectedTicket.status !== "Resolved" && (
              <form onSubmit={handleReply}>
                <label htmlFor="reply">Reply to customer</label>
                <textarea
                  id="reply"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write a helpful response..."
                  rows="4"
                  required
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-secondary"
                    onClick={() => {
                      updateTicket(selectedTicket.id, { status: "Resolved" });
                      setSelectedTicket(null);
                      showNotice(`Ticket #${selectedTicket.id} resolved`);
                    }}
                  >
                    Mark resolved
                  </button>
                  <button type="submit" className="modal-primary">
                    <i className="bi bi-send" /> Send reply
                  </button>
                </div>
              </form>
            )}
            {selectedTicket.status === "Resolved" && (
              <div className="resolved-note">
                <i className="bi bi-check-circle-fill" /> This ticket has been
                resolved.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Complaints;
