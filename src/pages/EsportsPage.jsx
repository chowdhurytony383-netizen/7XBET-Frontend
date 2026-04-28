import ContentPageTemplate from './ContentPageTemplate.jsx';
import './EsportsPage.css';

export default function EsportsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Esports"
      title="Esports"
      description="Esports tournaments, matches and odds will load from the backend."
      endpoint="/esports/events"
      emptyTitle="No esports available"
      emptyMessage="Add esports content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
