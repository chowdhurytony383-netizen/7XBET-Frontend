import ContentPageTemplate from './ContentPageTemplate.jsx';
import './VipRewardsPage.css';

export default function VipRewardsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Promotions"
      title="VIP rewards"
      description="VIP reward levels and benefits will load from the backend."
      endpoint="/bonuses/vip"
      emptyTitle="No vip rewards available"
      emptyMessage="Add vip rewards content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
