import ContentPageTemplate from './ContentPageTemplate.jsx';
import './SlotsPage.css';

export default function SlotsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Casino"
      title="Slots"
      description="Slot games and providers will load from the backend."
      endpoint="/casino/slots"
      emptyTitle="No slots available"
      emptyMessage="Add slots content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
