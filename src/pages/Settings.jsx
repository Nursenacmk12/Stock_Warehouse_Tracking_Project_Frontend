import "./Settings.css";

const cards = [
  {
    title: "Genel",
    desc: "Dil, saat dilimi ve varsayılan depo gibi tercihler backend bağlandığında burada olacak.",
    badge: "Yakında",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    title: "Bildirimler",
    desc: "Kritik stok ve hareket uyarıları için e-posta veya uygulama içi bildirim seçenekleri planlanıyor.",
    badge: "Planlanan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Güvenlik",
    desc: "Oturum süresi ve parola politikaları sunucu tarafındaki kimlik yapılandırmasıyla uyumlu yönetilecek.",
    badge: "API",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

function Settings() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Sistem</span>
          <h1>Ayarlar</h1>
          <p>Panel tercihleri ve yönetim seçenekleri; API tam entegrasyonuyla burada toplanacak.</p>
        </div>
      </div>

      <div className="settings-intro card">
        <div className="settings-intro-inner">
          <span className="settings-intro-badge">Durum</span>
          <h2>Backend entegrasyonu sürüyor</h2>
          <p>
            Kullanıcı rolleri, depo listesi ve bildirim kuralları API üzerinden yönetildiğinde bu sayfadaki
            kartlar etkinleştirilecek. Şimdilik arayüz altyapısı hazır.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {cards.map((item) => (
          <article key={item.title} className="settings-card">
            <div className="settings-card-icon" aria-hidden>
              {item.icon}
            </div>
            <div className="settings-card-head">
              <span className={`settings-pill settings-pill--${item.badge === "API" ? "api" : "muted"}`}>
                {item.badge}
              </span>
              <h2>{item.title}</h2>
            </div>
            <p className="settings-card-desc">{item.desc}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Settings;
