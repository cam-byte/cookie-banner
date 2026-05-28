<script>
(function () {

// Set window.privacy_allow = { disabled: true } before this script to suppress the banner entirely
var privacy_allow = Object.assign({ disabled: false }, window.privacy_allow || {});
window.privacy_allow = privacy_allow;

// Per-site override API — call before or after this script:
//   privacy_config.set('variant', 'manage');
if (!window.privacy_config || typeof window.privacy_config !== 'object') window.privacy_config = {};
Object.defineProperty(window.privacy_config, 'set', {
	enumerable: false, configurable: true,
	value: function (key, val) { window.privacy_config[key] = val; }
});

// variant: 'simple' → Decline / Accept All banner (no modal)
// variant: 'manage' → Manage / Accept All banner + preferences modal
var privacy_config_defaults = {
	primaryColor:     '#1e3a5f',
	bgColor:          '#ffffff',
	textColor:        '#374151',
	fontFamily:       'inherit',
	buttonRadius:     '4px',
	privacyPolicyUrl: '/privacy/',
	variant:          'simple',
	bannerText:       'We use cookies and tracking technologies to improve your browsing experience on our website, to show you personalized content, and to analyze our website traffic. Read our [privacy policy] to learn more.',
	declineLabel:     'Decline',
	manageLabel:      'Manage',
	acceptLabel:      'Accept All',
	modalTitle:       'Your tracking preferences.',
	modalDesc:        'We use tracking technologies, including scripts that may not set cookies, to understand how you use our site and deliver relevant content. You can learn more in our',
	submitLabel:      'Submit Preferences',
	rejectLabel:      'Reject all',
	cancelLabel:      'Cancel',
	categories: [
		{
			id:          'tracking',
			label:       'Tracking & Analytics',
			description: 'Scripts and technologies that help us understand how visitors interact with our site, measure performance, and serve relevant content and ads.',
			defaultOn:   true,
		}
	]
};
var privacy_config;

// ─── helpers ───────────────────────────────────────────────────────────────

function privacy_cb_el(tag, props) {
	var node = document.createElement(tag);
	if (props) Object.keys(props).forEach(function (k) { node[k] = props[k]; });
	return node;
}

function privacy_cb_removeBanner() {
	var el = document.getElementById('di-consent-banner');
	if (el) el.parentNode.removeChild(el);
}

function privacy_cb_removeModal() {
	var el = document.getElementById('di-cookie-pref-dialog');
	if (!el) return;
	try { el.close(); } catch (e) {}
	if (el.parentNode) el.parentNode.removeChild(el);
}

function privacy_cb_accept() {
	try { if (window.DiPrivacy && typeof window.DiPrivacy.accept === 'function') window.DiPrivacy.accept(); } catch (e) {}
	privacy_cb_removeModal(); privacy_cb_removeBanner();
}

function privacy_cb_reject() {
	try { if (window.DiPrivacy && typeof window.DiPrivacy.deny === 'function') window.DiPrivacy.deny(); } catch (e) {}
	privacy_cb_removeModal(); privacy_cb_removeBanner();
}

function privacy_cb_rejectAll() {
	privacy_config.categories.forEach(function (cat) {
		var t = document.getElementById('di-cm-' + cat.id + '-toggle');
		if (t) t.checked = false;
	});
	privacy_cb_reject();
}

function privacy_cb_savePreferences() {
	var anyOff = privacy_config.categories.some(function (cat) {
		var t = document.getElementById('di-cm-' + cat.id + '-toggle');
		return t && !t.checked;
	});
	anyOff ? privacy_cb_reject() : privacy_cb_accept();
}

// ─── styles ────────────────────────────────────────────────────────────────

function privacy_cb_injectStyles() {
	var existing = document.getElementById('di-consent-banner-styles');
	if (existing) existing.parentNode.removeChild(existing);
	var style = document.createElement('style');
	style.id = 'di-consent-banner-styles';
	var css = '';

	css += '#di-consent-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999999999;background:var(--di-cb-bg);box-shadow:0 -4px 16px rgba(0,0,0,.10);padding:20px 24px;font-family:var(--di-cb-font);box-sizing:border-box;}';
	css += '#di-consent-banner .di-cb__inner{display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:32px;max-width:1280px;margin:0 auto;}';
	css += '@media(min-width:640px){#di-consent-banner .di-cb__inner{flex-direction:row;}}';
	css += '#di-consent-banner .di-cb__text{font-size:14px;color:var(--di-cb-text);margin:0;}';
	css += '#di-consent-banner .di-cb__learn{color:var(--di-cb-primary);text-decoration:underline;transition:opacity .2s ease;}';
	css += '#di-consent-banner .di-cb__learn:hover{opacity:.8;}';
	css += '#di-consent-banner .di-cb__actions{display:flex;gap:8px!important;flex-shrink:0;}';
	css += '#di-consent-banner .di-cb__btn{cursor:pointer;font-size:16px;font-weight:500;padding:12px 24px;border-radius:var(--di-cb-radius);border:1px solid transparent;line-height:1;white-space:nowrap;transition:background .2s ease,color .2s ease,opacity .2s ease;}';
	css += '#di-consent-banner .di-cb__btn--secondary{background:transparent;border-color:var(--di-cb-primary);color:var(--di-cb-primary);}';
	css += '#di-consent-banner .di-cb__btn--secondary:hover{background:var(--di-cb-primary);color:#fff;}';
	css += '#di-consent-banner .di-cb__btn--primary{background:var(--di-cb-primary);border-color:var(--di-cb-primary);color:#fff;}';
	css += '#di-consent-banner .di-cb__btn--primary:hover{opacity:.88;}';

	css += '@keyframes di-cm-fadein{from{opacity:0}to{opacity:1}}';
	css += '@keyframes di-cm-slidein{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}';
	css += '#di-cookie-pref-dialog{border:none;padding:0;margin:auto;background:#fff;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,.22);max-width:480px;width:calc(100vw - 32px);box-sizing:border-box;overflow:hidden;font-family:var(--di-cb-font);animation:di-cm-slidein .2s ease;}';
	css += '#di-cookie-pref-dialog::backdrop{background:rgba(0,0,0,.45);animation:di-cm-fadein .18s ease;}';
	css += '#di-cookie-pref-dialog .di-cm__header{padding:22px 24px 0;}';
	css += '#di-cookie-pref-dialog .di-cm__title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}';
	css += '#di-cookie-pref-dialog .di-cm__title{font-size:19px;font-weight:700;color:#111827;margin:0 0 8px;line-height:1.3;}';
	css += '#di-cookie-pref-dialog .di-cm__close{background:none;border:none;cursor:pointer;color:#9ca3af;font-size:22px;line-height:1;padding:0;flex-shrink:0;margin-top:2px;transition:color .15s ease;}';
	css += '#di-cookie-pref-dialog .di-cm__close:hover{color:#374151;}';
	css += '#di-cookie-pref-dialog .di-cm__desc{font-size:13px;color:#6b7280;margin:0;line-height:1.55;padding:0 24px;}';
	css += '#di-cookie-pref-dialog .di-cm__desc a{color:var(--di-cb-primary);text-decoration:underline;}';
	css += '#di-cookie-pref-dialog .di-cm__rows{margin-top:16px;border-top:1px solid #f3f4f6;}';
	css += '#di-cookie-pref-dialog .di-cm__item{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:16px 24px;border-bottom:1px solid #f3f4f6;}';
	css += '#di-cookie-pref-dialog .di-cm__item-info{flex:1;}';
	css += '#di-cookie-pref-dialog .di-cm__item-label{font-size:14px;font-weight:600;color:#111827;margin:0 0 4px;}';
	css += '#di-cookie-pref-dialog .di-cm__item-desc{font-size:12px;color:#6b7280;margin:0;line-height:1.5;}';
	css += '#di-cookie-pref-dialog .di-cm__toggle-wrap{flex-shrink:0;position:relative;width:44px;height:24px;margin-top:2px;}';
	css += '#di-cookie-pref-dialog .di-cm__toggle-wrap input{opacity:0;width:0;height:0;position:absolute;}';
	css += '#di-cookie-pref-dialog .di-cm__toggle-track{position:absolute;inset:0;background:#d1d5db;border-radius:999px;cursor:pointer;transition:background .2s ease;}';
	css += '#di-cookie-pref-dialog .di-cm__toggle-track::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s ease;}';
	css += '#di-cookie-pref-dialog .di-cm__toggle-wrap input:checked+.di-cm__toggle-track{background:var(--di-cb-primary);}';
	css += '#di-cookie-pref-dialog .di-cm__toggle-wrap input:checked+.di-cm__toggle-track::after{transform:translateX(20px);}';
	css += '#di-cookie-pref-dialog .di-cm__footer{display:flex;gap:8px;padding:16px 24px;flex-wrap:wrap;}';
	css += '#di-cookie-pref-dialog .di-cm__btn{cursor:pointer;font-size:14px;font-weight:500;padding:10px 16px;border-radius:var(--di-cb-radius);border:1px solid transparent;line-height:1;white-space:nowrap;flex:1;transition:background .2s ease,color .2s ease,opacity .2s ease;}';
	css += '#di-cookie-pref-dialog .di-cm__btn--cancel{background:transparent;border-color:#d1d5db;color:#374151;}';
	css += '#di-cookie-pref-dialog .di-cm__btn--cancel:hover{background:#f9fafb;}';
	css += '#di-cookie-pref-dialog .di-cm__btn--reject{background:transparent;border-color:var(--di-cb-primary);color:var(--di-cb-primary);}';
	css += '#di-cookie-pref-dialog .di-cm__btn--reject:hover{background:var(--di-cb-primary);color:#fff;}';
	css += '#di-cookie-pref-dialog .di-cm__btn--submit{background:var(--di-cb-primary);border-color:var(--di-cb-primary);color:#fff;}';
	css += '#di-cookie-pref-dialog .di-cm__btn--submit:hover{opacity:.88;}';
	css += '#di-cookie-pref-dialog .di-cm__policy{padding:0 24px 16px;font-size:11px;color:#9ca3af;}';
	css += '#di-cookie-pref-dialog .di-cm__policy a{color:#9ca3af;text-decoration:underline;}';
	css += '#di-cookie-pref-dialog .di-cm__policy a:hover{color:#6b7280;}';

	style.textContent = css;
	document.head.appendChild(style);
}

// ─── modal ─────────────────────────────────────────────────────────────────

function privacy_cb_createDialog() {
	var dialog = privacy_cb_el('dialog', { id: 'di-cookie-pref-dialog' });
	dialog.style.setProperty('--di-cb-primary', privacy_config.primaryColor);
	dialog.style.setProperty('--di-cb-radius',  privacy_config.buttonRadius);
	dialog.style.setProperty('--di-cb-font',    privacy_config.fontFamily);

	dialog.addEventListener('click', function (e) {
		var r = dialog.getBoundingClientRect();
		if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) privacy_cb_removeModal();
	});
	dialog.addEventListener('cancel', function (e) { e.preventDefault(); privacy_cb_removeModal(); });

	var titleRow = privacy_cb_el('div', { className: 'di-cm__title-row' });
	var titleEl  = privacy_cb_el('p',   { className: 'di-cm__title', textContent: privacy_config.modalTitle });
	var closeBtn = privacy_cb_el('button', { className: 'di-cm__close', type: 'button', innerHTML: '&times;' });
	closeBtn.setAttribute('aria-label', 'Close');
	closeBtn.addEventListener('click', privacy_cb_removeModal);
	titleRow.appendChild(titleEl);
	titleRow.appendChild(closeBtn);

	var header = privacy_cb_el('div', { className: 'di-cm__header' });
	header.appendChild(titleRow);

	var desc = privacy_cb_el('p', { className: 'di-cm__desc' });
	desc.appendChild(document.createTextNode(privacy_config.modalDesc + ' '));
	desc.appendChild(privacy_cb_el('a', { href: privacy_config.privacyPolicyUrl, textContent: 'Privacy Policy' }));
	desc.appendChild(document.createTextNode('.'));

	var rows = privacy_cb_el('div', { className: 'di-cm__rows' });
	privacy_config.categories.forEach(function (cat) {
		var row   = privacy_cb_el('div',   { className: 'di-cm__item' });
		var info  = privacy_cb_el('div',   { className: 'di-cm__item-info' });
		var lbl   = privacy_cb_el('p',     { className: 'di-cm__item-label', textContent: cat.label });
		var dsc   = privacy_cb_el('p',     { className: 'di-cm__item-desc',  textContent: cat.description });
		var wrap  = privacy_cb_el('label', { className: 'di-cm__toggle-wrap' });
		var input = privacy_cb_el('input', { type: 'checkbox', id: 'di-cm-' + cat.id + '-toggle', checked: cat.defaultOn !== false });
		var track = privacy_cb_el('span',  { className: 'di-cm__toggle-track' });
		info.appendChild(lbl); info.appendChild(dsc);
		wrap.appendChild(input); wrap.appendChild(track);
		row.appendChild(info); row.appendChild(wrap);
		rows.appendChild(row);
	});

	var footer     = privacy_cb_el('div',    { className: 'di-cm__footer' });
	var cancelBtn  = privacy_cb_el('button', { className: 'di-cm__btn di-cm__btn--cancel', type: 'button', textContent: privacy_config.cancelLabel });
	var rejectBtn  = privacy_cb_el('button', { className: 'di-cm__btn di-cm__btn--reject', type: 'button', textContent: privacy_config.rejectLabel });
	var submitBtn  = privacy_cb_el('button', { className: 'di-cm__btn di-cm__btn--submit', type: 'button', textContent: privacy_config.submitLabel });
	cancelBtn.addEventListener('click', privacy_cb_removeModal);
	rejectBtn.addEventListener('click', privacy_cb_rejectAll);
	submitBtn.addEventListener('click', privacy_cb_savePreferences);
	footer.appendChild(cancelBtn); footer.appendChild(rejectBtn); footer.appendChild(submitBtn);

	var policyFooter = privacy_cb_el('div', { className: 'di-cm__policy' });
	policyFooter.appendChild(privacy_cb_el('a', { href: privacy_config.privacyPolicyUrl, textContent: 'Privacy Policy' }));

	dialog.appendChild(header);
	dialog.appendChild(desc);
	dialog.appendChild(rows);
	dialog.appendChild(footer);
	dialog.appendChild(policyFooter);
	return dialog;
}

function privacy_cb_openModal() {
	privacy_cb_removeModal();
	var dialog = privacy_cb_createDialog();
	document.body.appendChild(dialog);
	try { dialog.showModal(); } catch (e) { dialog.setAttribute('open', ''); }
}

// ─── banner ────────────────────────────────────────────────────────────────

function privacy_cb_createBanner() {
	var wrap  = privacy_cb_el('div', { id: 'di-consent-banner' });
	var inner = privacy_cb_el('div', { className: 'di-cb__inner' });
	var p     = privacy_cb_el('p',   { className: 'di-cb__text' });

	var match = privacy_config.bannerText.match(/^([\s\S]*?)\[([^\]]+)\]([\s\S]*)$/);
	if (match) {
		p.appendChild(document.createTextNode(match[1]));
		p.appendChild(privacy_cb_el('a', { className: 'di-cb__learn', href: privacy_config.privacyPolicyUrl, textContent: match[2] }));
		p.appendChild(document.createTextNode(match[3]));
	} else {
		p.textContent = privacy_config.bannerText;
	}

	var actions   = privacy_cb_el('div', { className: 'di-cb__actions' });
	var secondary = privacy_config.variant === 'manage'
		? privacy_cb_el('button', { className: 'di-cb__btn di-cb__btn--secondary', type: 'button', textContent: privacy_config.manageLabel })
		: privacy_cb_el('button', { className: 'di-cb__btn di-cb__btn--secondary', type: 'button', textContent: privacy_config.declineLabel });
	var acceptBtn = privacy_cb_el('button', { className: 'di-cb__btn di-cb__btn--primary', type: 'button', textContent: privacy_config.acceptLabel });

	secondary.addEventListener('click', privacy_config.variant === 'manage' ? privacy_cb_openModal : privacy_cb_reject);
	acceptBtn.addEventListener('click', privacy_cb_accept);

	actions.appendChild(secondary);
	actions.appendChild(acceptBtn);
	inner.appendChild(p);
	inner.appendChild(actions);
	wrap.appendChild(inner);
	return wrap;
}

// ─── init ──────────────────────────────────────────────────────────────────

function privacy_cb_init() {
	privacy_config = Object.assign({}, privacy_config_defaults, window.privacy_config || {});
	if (window.privacy_allow.disabled === true) return;
	if (!window.DiPrivacy || window.DiPrivacy.consent !== 'pending' || window.DiPrivacy.gpcEnabled) return;
	privacy_cb_injectStyles();
	var banner = privacy_cb_createBanner();
	banner.style.setProperty('--di-cb-primary', privacy_config.primaryColor);
	banner.style.setProperty('--di-cb-bg',      privacy_config.bgColor);
	banner.style.setProperty('--di-cb-text',    privacy_config.textColor);
	banner.style.setProperty('--di-cb-font',    privacy_config.fontFamily);
	banner.style.setProperty('--di-cb-radius',  privacy_config.buttonRadius);
	document.body.appendChild(banner);
}

document.readyState === 'loading'
	? document.addEventListener('DOMContentLoaded', privacy_cb_init)
	: privacy_cb_init();

})();
</script>
