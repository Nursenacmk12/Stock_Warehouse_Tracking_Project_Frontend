import "./Settings.css";

function Settings() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Sistem</span>
          <h1>Ayarlar</h1>
          <p>Genel panel tercihleri ve yakında eklenecek yönetim ayarları.</p>
        </div>
      </div>

      <div className="card">
        <div className="settings-section">
          <span className="badge neutral">Hazırlanıyor</span>
          <h2>Genel Ayarlar</h2>
          <p className="settings-note">
            Backend entegrasyonu tamamlandığında kullanıcı, depo ve bildirim ayarları bu sayfadan
            yönetilebilir hale gelecektir.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
