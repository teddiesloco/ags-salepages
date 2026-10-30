(function(){
  var urlParams = new URLSearchParams(window.location.search);
  var refCode = urlParams.get('ref') || '';
  var utm = {
    utm_source: urlParams.get('utm_source') || 'trang-qua',
    utm_medium: urlParams.get('utm_medium') || null,
    utm_campaign: urlParams.get('utm_campaign') || null,
    utm_content: urlParams.get('utm_content') || null
  };

  // If user arrives with #verify= or #recovery= fragment on Page 1, forward immediately to Page 2 (/opc/qua-tang/)
  var hash = window.location.hash || '';
  if(hash.indexOf('verify=') !== -1 || hash.indexOf('recovery=') !== -1) {
    window.location.replace('/opc/qua-tang/' + window.location.search + hash);
    return;
  }

  document.addEventListener('DOMContentLoaded', function(){
    var sticky = document.getElementById('stickyGift');
    var hero = document.querySelector('.hero');
    var registration = document.getElementById('dang-ky');
    if(sticky && hero && registration && 'IntersectionObserver' in window) {
      var visible = new Map([[hero, true], [registration, true]]);
      var observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){ visible.set(entry.target, entry.isIntersecting); });
        sticky.hidden = visible.get(hero) || visible.get(registration);
      });
      observer.observe(hero);
      observer.observe(registration);
    }

    var form = document.getElementById('regForm');
    var errBox = document.getElementById('formErrorMsg');
    var btn = document.getElementById('btnSubmitForm');

    function showError(msg) {
      if(errBox) {
        errBox.innerText = msg;
        errBox.style.display = 'block';
      } else {
        alert(msg);
      }
      if(btn) {
        btn.innerText = 'Nhận Bộ Khởi Động & Qua Trang Quà 5.525.000đ →';
        btn.disabled = false;
      }
    }

    if(form) {
      form.addEventListener('submit', function(e){
        e.preventDefault();
        if(errBox) errBox.style.display = 'none';

        var consentEl = document.getElementById('regConsent');
        if(consentEl && !consentEl.checked) {
          showError('Vui lòng tích chọn đồng ý nhận quà tặng và hỗ trợ kỹ thuật theo Nghị định 13/2023/NĐ-CP.');
          return;
        }

        if(btn) {
          btn.innerText = 'Đang gửi thư xác nhận & mở trang đặc quyền...';
          btn.disabled = true;
        }

        var name = (document.getElementById('regName') || {}).value || '';
        var phone = (document.getElementById('regPhone') || {}).value || '';
        var email = (document.getElementById('regEmail') || {}).value || '';
        var hp = (document.getElementById('regHp') || {}).value || '';

        fetch('/api/gift/register', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            ref: refCode || null,
            nd13_consent: true,
            website_url: hp.trim() || null,
            utm_source: utm.utm_source,
            utm_medium: utm.utm_medium,
            utm_campaign: utm.utm_campaign,
            utm_content: utm.utm_content
          })
        })
        .then(function(res){
          if(res.status >= 500) throw new Error('Chưa kết nối được máy chủ. Bạn thử lại sau ít giây nha!');
          return res.json().then(function(data){
            if(!res.ok) throw new Error(data.detail || 'Đăng ký chưa thành công. Vui lòng kiểm tra lại thông tin!');
            return data;
          });
        })
        .then(function(regData){
          try {
            sessionStorage.setItem('ags_lead_name', name.trim());
            sessionStorage.setItem('ags_lead_email', email.trim().toLowerCase());
            sessionStorage.setItem('ags_lead_ref', regData.referral_code || '');
          } catch(e){}
          var nextUrl = '/opc/qua-tang/' + (regData.referral_code ? ('?myref=' + encodeURIComponent(regData.referral_code)) : '');
          window.location.href = nextUrl;
        })
        .catch(function(err){
          showError(err.message || 'Chưa kết nối được. Bạn thử lại sau ít phút nha!');
        });
      });
    }
  });
})();
