import React from "react";

const InvestmentsOverviewPage: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Investments Overview</h1>
      <section>
        <p>
          Welcome to your investments dashboard. Here you can view a summary of
          your portfolio, recent activity, and key metrics.
        </p>
        {/* Add summary cards, charts, or tables here */}
        <div style={{ marginTop: "2rem" }}>
          <h2>Portfolio Summary</h2>
          <p>No data available. Start by adding investments.</p>
        </div>
        <div style={{ marginTop: "2rem" }}>
          <h2>Recent Activity</h2>
          <p>No recent activity.</p>
        </div>
      </section>
    </div>
  );
};

export default InvestmentsOverviewPage;
