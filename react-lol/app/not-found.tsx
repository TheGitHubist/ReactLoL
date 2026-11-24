import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 · LOST IN THE SHADOW REALM</p>
      <h1>This page is not in the archive.</h1>
      <p>The card you&apos;re looking for slipped beyond the edge of the Duel Disk.</p>
      <Link className="primary-button" href="/">Return to the card library</Link>
    </main>
  );
}
