// Strona główna — placeholder na czas Fazy 0.
// W Fazie 2 zastąpimy to listą prawdziwych postów z bazy.

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <span className="badge">Wersja 0.1 • W budowie</span>
        <h1>Big Blog</h1>
        <p>
          Miejsce do dzielenia się myślami, zdjęciami i historiami.
          Strona powstaje na żywo — każdy commit ląduje tutaj w 60 sekund.
        </p>
      </section>

      <section className="coming-soon">
        <h2>Wkrótce</h2>
        <div className="coming-soon-grid">
          <div className="coming-soon-card">
            <div className="icon">🔐</div>
            <div className="title">Konta i logowanie</div>
            <div className="desc">Email, Google, Facebook</div>
          </div>
          <div className="coming-soon-card">
            <div className="icon">📝</div>
            <div className="title">Pisanie postów</div>
            <div className="desc">Tytuł, treść, zdjęcia</div>
          </div>
          <div className="coming-soon-card">
            <div className="icon">💬</div>
            <div className="title">Komentarze i lajki</div>
            <div className="desc">Drzewo dyskusji</div>
          </div>
        </div>
      </section>
    </>
  );
}
