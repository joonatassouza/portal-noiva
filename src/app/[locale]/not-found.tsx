import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">404</p>
      <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Página não encontrada</h1>
      <p className="mt-3 text-ink-soft">
        O endereço que você acessou não existe (ou foi movido).
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-bg hover:no-underline"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}
