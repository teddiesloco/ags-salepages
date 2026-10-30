(function(){
  var urlParams = new URLSearchParams(window.location.search);
  var myRefParam = urlParams.get('myref') || '';
  var pollTimer = null;
  var statusInFlight = false;

  function renderVerifyBanner(isVerified, fullName) {
    var box = document.getElementById('verifyBannerBox');
    var eyebrow = document.getElementById('verifyEyebrow');
    var headline = document.getElementById('verifyHeadline');
    var desc = document.getElementById('verifyDescText');
    var resendBtn = document.getElementById('btnResendVerify');
    var navStatus = document.getElementById('navStatusText');
    var safeName = fullName || 'bạn';

    if(isVerified) {
      if(box) box.classList.add('verified');
      if(navStatus) navStatus.innerText = '✓ ĐÃ XÁC THỰC EMAIL';
      if(eyebrow) {
        eyebrow.style.color = 'var(--signal)';
        eyebrow.innerText = '// ✓ ĐÃ XÁC THỰC HỘP THƯ · EMAIL SỐ 2 GIAO BỘ KHỞI ĐỘNG & LINK ZALO ĐÃ GỬI';
      }
      if(headline) {
        headline.innerHTML = 'Chúc mừng <span style="color:var(--signal);">' + safeName + '</span>! Hộp thư của bạn đã xác thực thành công.';
      }
      if(desc) {
        desc.innerHTML = 'Hệ thống vừa gửi <strong>Email số 2 chứa trọn bộ đường dẫn tải Bộ Khởi Động (kèm 6 khuôn trang bán hàng AGS-Salepages) và đường dẫn vào Nhóm Zalo OPC gặp Nhân sự số Amon 24/7</strong> vào hộp thư của bạn. Ngay bên dưới, bạn hãy chia sẻ cho <strong>2 người bạn</strong> (hoặc mở khóa nhanh) để nhận thêm trọn bộ <strong>AGS-Business-KIT (trị giá 5.525.000đ)</strong>!';
      }
      if(resendBtn) resendBtn.hidden = true;
    } else {
      if(box) box.classList.remove('verified');
      if(navStatus) navStatus.innerText = 'CHỜ XÁC NHẬN EMAIL';
      if(eyebrow) {
        eyebrow.style.color = '#B45309';
        eyebrow.innerText = '// BƯỚC 1 BẮT BUỘC: XÁC NHẬN HỘP THƯ ĐỂ NHẬN LINK TẢI & VÀO NHÓM ZALO';
      }
      if(headline) {
        headline.innerHTML = 'Chào <span id="userNameDisplay" data-testid="tc-name" style="color:var(--signal);">' + safeName + '</span>, hãy mở Email và bấm nút "Xác nhận hộp thư"!';
      }
      if(resendBtn) resendBtn.hidden = false;
    }
  }

  function updatePageUi(data) {
    if(!data) return;
    var authRecovery = document.getElementById('authRecovery');
    if(authRecovery) authRecovery.hidden = true;

    renderVerifyBanner(!!data.email_verified, data.full_name);

    var myRef = data.referral_code || myRefParam || '';
    var refLink = window.location.origin + '/opc' + (myRef ? ('?ref=' + encodeURIComponent(myRef)) : '');
    var inputEl = document.getElementById('shareLinkInput');
    if(inputEl) inputEl.value = refLink;

    var scriptP = document.getElementById('shareScriptText');
    if(scriptP && refLink) {
      scriptP.innerText =
        'Hồi trước mỗi lần khách nhắn Zalo hỏi giá hay muốn làm cái trang giới thiệu sản phẩm là mình ngồi gõ tay mỏi nhừ cả đêm, nhờ AI viết thì toàn ra văn mẫu sáo rỗng.\n\n' +
        'Hôm nay mình vừa nhận được Bộ Khởi Động Hệ Thống Bán Hàng & gói AGS-Zalo-Bot tiếp khách tự động của bên AgentSea. Hay nhất là mình không cần biết viết câu lệnh dài: dán vào là AI tự đóng vai chuyên gia hỏi ngược mình 4-5 câu về mặt hàng đang bán rồi tự lắp ra Bản chào hàng, Hồ sơ ranh giới chống bịa giá và cả 6 khuôn trang web bán hàng nối sẵn bảng tính Google Sheets.\n\n' +
        'Anh em nào đang tự kinh doanh, làm dịch vụ, tổ chức sự kiện hay muốn có bot Zalo tiếp khách tự động 24/7 thì vào lấy về dùng thử miễn phí ở đây nè:\n' +
        refLink;
    }

    var bumpMemo = 'BUMP199 ' + (myRef || 'AGS');
    var memoEl = document.getElementById('bumpMemoText');
    if(memoEl) memoEl.innerText = bumpMemo;
    var qrImg = document.getElementById('bumpQrImg');
    if(qrImg) {
      qrImg.src = data.bump_qr_url || ('/api/gift/bump-qr?code=' + encodeURIComponent(myRef || 'AGS'));
    }

    var count = data.referral_count || 0;
    var isUnlocked = !!data.level2_unlocked || count >= 2;
    var scoreEl = document.getElementById('refScoreText');
    if(scoreEl) scoreEl.innerText = Math.min(count, 2) + '/2 BẠN NHẬN QUÀ';

    var pct = Math.min((count / 2) * 100, 100);
    var fillEl = document.getElementById('refProgressFill');
    if(fillEl) fillEl.style.width = pct + '%';

    var hintText = document.getElementById('refHintText');
    var bumpBox = document.getElementById('bump199Section');

    if(isUnlocked) {
      clearInterval(pollTimer);
      if(hintText) {
        hintText.innerHTML = '🎉 <strong>Đã đủ 2/2 bạn nhận quà!</strong> Hệ thống đã mở khóa và gửi trọn bộ <strong>AGS-Zalo-Bot (trị giá 5.525.000đ)</strong> về hộp thư của bạn!';
      }
      if(bumpBox) {
        bumpBox.innerHTML =
          '<div>' +
          '<span class="bump-tag" style="background:var(--signal);">✓ ĐÃ MỞ KHÓA 0 ĐỒNG</span>' +
          '<h3 style="font-size:19px;margin-bottom:8px;">Chúc mừng! Trợ Lý AGS-Zalo-Bot (5.525.000đ) Của Bạn Đã Mở Khóa!</h3>' +
          '<p style="font-size:14px;color:var(--ink-2);margin-bottom:14px;">Bạn đã hoàn thành điều kiện mời 2 người bạn. Hãy kiểm tra hộp thư đã xác thực của bạn để tải trọn bộ <strong>AGS-Zalo-Bot (Trợ Lý Zalo AI Tiếp Khách 24/7 &amp; Báo Cáo 1-Click)</strong>!</p>' +
          '</div>';
      }
    } else if(hintText && count > 0) {
      hintText.innerHTML = '⚡ Tuyệt vời! Đã có <strong>' + count + '/2 người bạn</strong> đăng ký qua link của bạn. Chỉ còn <strong>' + (2 - count) + ' người bạn</strong> nữa là bạn nhận trọn bộ <strong>AGS-Zalo-Bot (5.525.000đ) hoàn toàn 0 đồng</strong>!';
    }
  }

  function fetchStatus(silentIfUnauth) {
    if(statusInFlight) return Promise.resolve(false);
    statusInFlight = true;
    return fetch('/api/gift/status', { credentials: 'include' })
      .then(function(res){
        if(!res.ok) throw new Error('UNAUTH');
        return res.json();
      })
      .then(function(data){
        updatePageUi(data);
        return true;
      })
      .catch(function(){
        var cachedName = '';
        var cachedRef = myRefParam;
        try {
          cachedName = sessionStorage.getItem('ags_lead_name') || '';
          cachedRef = cachedRef || sessionStorage.getItem('ags_lead_ref') || '';
        } catch(e){}
        updatePageUi({
          full_name: cachedName || 'bạn',
          referral_code: cachedRef,
          referral_count: 0,
          email_verified: false,
          level2_unlocked: false
        });
        if(!silentIfUnauth) {
          var authRecovery = document.getElementById('authRecovery');
          if(authRecovery) authRecovery.hidden = false;
        }
        return false;
      })
      .finally(function(){ statusInFlight = false; });
  }

  function handleRecoveryFragment() {
    var hash = window.location.hash || '';
    if(!hash || (hash.indexOf('recovery=') === -1 && hash.indexOf('verify=') === -1)) {
      return Promise.resolve(false);
    }
    var m = hash.match(/(?:recovery|verify)=([^&]+)/);
    if(!m) return Promise.resolve(false);
    var recToken = decodeURIComponent(m[1]);
    if(window.history && window.history.replaceState) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
    return fetch('/api/gift/exchange-recovery', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recovery_token: recToken })
    })
    .then(function(res){
      if(!res.ok) throw new Error('Invalid verification token');
      return res.json();
    })
    .then(function(){ return true; })
    .catch(function(){
      var authRecovery = document.getElementById('authRecovery');
      if(authRecovery) authRecovery.hidden = false;
      return false;
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    handleRecoveryFragment().then(function(recovered){
      fetchStatus(!recovered).then(function(loggedIn){
        if(loggedIn) {
          pollTimer = setInterval(function(){ fetchStatus(true); }, 15000);
        }
      });
    });

    var btnToggleQr = document.getElementById('btnToggleBumpQr');
    if(btnToggleQr) {
      btnToggleQr.addEventListener('click', function(){
        var drawer = document.getElementById('bumpQrDrawer');
        if(!drawer) return;
        drawer.hidden = !drawer.hidden;
        btnToggleQr.innerText = drawer.hidden
          ? '⚡ Mở Mã VietQR 199.000đ — Nhận Trọn Bộ 5.525.000đ Ngay →'
          : '▲ Thu gọn mã VietQR 199.000đ';
      });
    }

    var btnResend = document.getElementById('btnResendVerify');
    if(btnResend) {
      btnResend.addEventListener('click', function(){
        var st = document.getElementById('resendStatusText');
        btnResend.disabled = true;
        btnResend.innerText = 'Đang gửi lại...';
        fetch('/api/gift/resend-verify', { method: 'POST', credentials: 'include' })
          .then(function(res){
            if(!res.ok) throw new Error('NEED_EMAIL');
            return res.json();
          })
          .then(function(d){
            if(st) {
              st.hidden = false;
              st.innerText = d.message || '✓ Đã gửi lại thư xác nhận vào hộp thư của bạn!';
            }
            btnResend.innerText = 'Đã gửi lại thư';
          })
          .catch(function(){
            var authRecovery = document.getElementById('authRecovery');
            if(authRecovery) authRecovery.hidden = false;
            btnResend.disabled = false;
            btnResend.innerText = 'Gửi lại thư xác nhận';
          });
      });
    }

    var btnCopy = document.getElementById('btnCopyLink');
    if(btnCopy) {
      btnCopy.addEventListener('click', function(){
        var input = document.getElementById('shareLinkInput');
        if(!input) return;
        input.select();
        try { navigator.clipboard.writeText(input.value); } catch(e){ document.execCommand('copy'); }
        btnCopy.innerText = '✓ Đã sao chép!';
        btnCopy.classList.add('copied');
        setTimeout(function(){
          btnCopy.innerText = 'Sao chép link';
          btnCopy.classList.remove('copied');
        }, 2500);
      });
    }

    var btnScript = document.getElementById('btnCopyScript');
    if(btnScript) {
      btnScript.addEventListener('click', function(){
        var p = document.getElementById('shareScriptText');
        if(!p) return;
        var textToCopy = p.innerText.trim();
        try { navigator.clipboard.writeText(textToCopy); } catch(e){}
        btnScript.innerText = '✓ Đã chép bài viết Viral!';
        setTimeout(function(){ btnScript.innerText = '📋 Chép bài viết Viral này'; }, 2500);
      });
    }

    var btnNative = document.getElementById('btnShareNative');
    if(btnNative) {
      btnNative.addEventListener('click', function(){
        var input = document.getElementById('shareLinkInput');
        var link = input ? input.value : (window.location.origin + '/opc');
        var p = document.getElementById('shareScriptText');
        var msg = p ? p.innerText.trim() : link;
        if(navigator.share) {
          navigator.share({ title: 'Bộ Khởi Động Hệ Thống Bán Hàng & AGS-Business-KIT — AgentSea', text: msg, url: link }).catch(function(){});
        } else {
          window.open('https://zalo.me/share?url=' + encodeURIComponent(link), '_blank');
        }
      });
    }

    var reqBtn = document.getElementById('btnRequestRecoveryLink');
    if(reqBtn) {
      reqBtn.addEventListener('click', function(){
        var emailInput = document.getElementById('recoveryEmailInput');
        var status = document.getElementById('recoveryReqStatus');
        if(!emailInput || !emailInput.value.trim()) return;
        reqBtn.disabled = true;
        reqBtn.innerText = 'Đang gửi...';
        fetch('/api/gift/request-recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.value.trim().toLowerCase() })
        })
        .then(function(res){ return res.json().then(function(d){ if(!res.ok) throw new Error(d.detail || 'Lỗi gửi email'); return d; }); })
        .then(function(){
          if(status) status.innerText = '✓ Đã gửi lại thư xác nhận vào email của bạn!';
          reqBtn.innerText = 'Đã gửi';
        })
        .catch(function(err){
          if(status) status.innerText = err.message;
          reqBtn.disabled = false;
          reqBtn.innerText = 'Thử lại';
        });
      });
    }
  });
})();
