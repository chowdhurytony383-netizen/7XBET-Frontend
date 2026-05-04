import ContentPageTemplate from './ContentPageTemplate.jsx';
import FreeDemoGameWidget from '../components/FreeDemoGameWidget.jsx';
import './SlotsPage.css';

export default function SlotsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Casino"
      title="Slots"
      description="Play slot game demos and explore available slot providers."
      endpoint="/casino/slots"
      emptyTitle="No slots available"
      emptyMessage="Add slots content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    >
      <FreeDemoGameWidget gameSlug="super-ace-deluxe" publisherId="7" />
    </ContentPageTemplate>
  );
}