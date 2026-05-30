// 법무 페이지 스텁 — /terms · /privacy · /disclaimer 공용.
// ⚠️ 후속: 실제 약관/개인정보/고지 콘텐츠 + LegalLayout fork.

type Props = { title: string };

export default function Legal({ title }: Props) {
  return (
    <section className="mx-auto max-w-3xl px-5 md:px-10 py-20">
      <p className="eyebrow mb-4">ASSA WAVE</p>
      <h1 className="text-3xl md:text-4xl font-display mb-6">{title}</h1>
      <p className="text-ink-soft">
        본 문서는 준비 중입니다. 법무 검토 후 게시됩니다. (후속 단계)
      </p>
    </section>
  );
}
