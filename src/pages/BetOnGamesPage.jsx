import ContentPageTemplate from './ContentPageTemplate.jsx';
import './BetOnGamesPage.css';

export default function BetOnGamesPage() {
  return (
    <ContentPageTemplate
      eyebrow="Games"
      title="BetOnGames"
      description="BetOnGames content will load from the backend/admin panel."
      endpoint="/bet-on-games"
      emptyTitle="No betongames available"
      emptyMessage="Add betongames content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
