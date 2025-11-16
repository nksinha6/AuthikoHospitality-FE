const cards = [
  {
    title: "Currently Checked in Guests",
    value: "48",
    description: "Users online in the past 10 minutes",
  },
  {
    title: "Total Bookings",
    value: "70",
    description: "Requests waiting for review",
  },
  // {
  //   title: "API Errors",
  //   value: "0.4%",
  //   description: "Failure rate today",
  // },
];

export default function Dashboard() {
  return (
    <section className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p>High-level glimpse of what is happening in OnePass right now.</p>
        </div>
        <div className="tag">Demo data</div>
      </header>

      <div className="card-grid">
        {cards.map((card) => (
          <article key={card.title}>
            <p className="eyebrow">{card.title}</p>
            <h2>{card.value}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      <div className="panel">
        <h3>Recent Activity</h3>
      </div>
    </section>
  );
}

