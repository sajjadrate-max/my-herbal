package pk.myherbal.app;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

// My Herbal — ویب سائٹ myherbalpk.com کو ایپ کی شکل میں کھولتا ہے۔
// سائٹ میں جو بھی تبدیلی ہو وہ ایپ میں خود آ جاتی ہے، ایپ دوبارہ بنانے کی ضرورت نہیں۔
public class MainActivity extends Activity {

    private static final String HOME_URL = "https://myherbalpk.com/";
    private static final String HOST = "myherbalpk.com";
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private WebView webView;
    private SwipeRefreshLayout swipe;
    private long pausedAt = 0;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        // اوپر سے نیچے کھینچیں تو صفحہ تازہ (نیا ورژن) ہو جائے — Chrome کی طرح
        swipe = new SwipeRefreshLayout(this);
        swipe.setColorSchemeColors(0xFF1F7A4D);
        swipe.addView(webView);
        swipe.setOnChildScrollUpCallback(new SwipeRefreshLayout.OnChildScrollUpCallback() {
            @Override
            public boolean canChildScrollUp(SwipeRefreshLayout parent, View child) {
                return webView.getScrollY() > 0;
            }
        });
        swipe.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
            @Override
            public void onRefresh() {
                refreshPage();
            }
        });
        setContentView(swipe);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        CookieManager.getInstance().setAcceptCookie(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                swipe.setRefreshing(false);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternally(request.getUrl());
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternally(Uri.parse(url));
            }
        });

        // PDF / تصویر منتخب کرنے کے لیے (اپ لوڈ اور سکرین شاٹ والے بٹن)
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent intent;
                try {
                    intent = params.createIntent();
                    if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    }
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (ActivityNotFoundException e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "فائل منتخب کرنے والی ایپ نہیں ملی", Toast.LENGTH_LONG).show();
                    return false;
                }
                return true;
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                if (!url.startsWith("http")) return;
                try {
                    DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                    req.setMimeType(mimeType);
                    req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimeType));
                    ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(req);
                    Toast.makeText(MainActivity.this, "ڈاؤن لوڈ شروع ہو گیا", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    openExternally(Uri.parse(url));
                }
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            Uri data = getIntent() != null ? getIntent().getData() : null;
            webView.loadUrl(data != null && HOST.equals(data.getHost()) ? data.toString() : HOME_URL);
        }
    }

    // پرانی محفوظ فائلیں ہٹا کر ویب سائٹ کا تازہ ورژن لائیں (کتابیں اور محفوظ ڈیٹا نہیں ہٹتے)
    private void refreshPage() {
        webView.clearCache(true);
        checkSiteUpdate();
        webView.reload();
    }

    // ویب سائٹ سے نیا ورژن پوچھیں؛ نیا ہو تو سائٹ خود ایک بار تازہ ہو جاتی ہے
    private void checkSiteUpdate() {
        webView.evaluateJavascript("try{navigator.serviceWorker&&navigator.serviceWorker.getRegistration().then(function(r){r&&r.update()})}catch(e){}", null);
    }

    // سائٹ کے اپنے صفحات ایپ کے اندر؛ واٹس ایپ، فون، ای میل اور دوسری سائٹیں باہر والی ایپ میں
    private boolean openExternally(Uri uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (("https".equals(scheme) || "http".equals(scheme)) && host != null
                && (host.equals(HOST) || host.endsWith("." + HOST))) {
            return false;
        }
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "یہ لنک کھولنے والی ایپ نہیں ملی", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri data = intent.getData();
        if (data != null && HOST.equals(data.getHost())) webView.loadUrl(data.toString());
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
        pausedAt = System.currentTimeMillis();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        // واپس آنے پر ویب سائٹ کا نیا ورژن چیک کریں
        if (pausedAt > 0) checkSiteUpdate();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.setVisibility(View.GONE);
            webView.destroy();
        }
        super.onDestroy();
    }
}
