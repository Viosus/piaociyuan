import FollowList from "../ui/FollowList";

type Props = { params: Promise<{ id: string }> };

export default async function FollowingPage({ params }: Props) {
  const { id } = await params;
  return <FollowList userId={id} listType="following" />;
}
