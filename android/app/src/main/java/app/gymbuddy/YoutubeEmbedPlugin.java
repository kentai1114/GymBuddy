package app.gymbuddy;

import android.app.Dialog;
import android.graphics.Color;
import android.os.Bundle;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "YoutubeEmbed")
public class YoutubeEmbedPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        String videoId = call.getString("videoId");
        if (videoId == null || videoId.trim().isEmpty()) {
            call.reject("missing videoId");
            return;
        }

        getActivity().runOnUiThread(() -> {
            Dialog dialog = new Dialog(getActivity(), android.R.style.Theme_DeviceDefault_Dialog_NoActionBar);
            dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);

            LinearLayout root = new LinearLayout(getContext());
            root.setOrientation(LinearLayout.VERTICAL);
            root.setBackgroundColor(Color.BLACK);

            TextView close = new TextView(getContext());
            close.setText("完成");
            close.setTextColor(Color.parseColor("#C8F542"));
            close.setTextSize(16);
            close.setPadding(36, 28, 36, 28);
            close.setOnClickListener(v -> dialog.dismiss());
            root.addView(close, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ));

            WebView webView = new WebView(getContext());
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            webView.setWebChromeClient(new WebChromeClient());
            webView.setWebViewClient(new WebViewClient());
            webView.setBackgroundColor(Color.BLACK);
            String url = "https://www.youtube.com/embed/" + videoId.trim()
                + "?playsinline=1&rel=0&modestbranding=1&autoplay=1";
            webView.loadUrl(url, java.util.Collections.singletonMap("Referer", "https://www.youtube.com"));

            root.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
            ));

            dialog.setContentView(root, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ));
            dialog.show();
            call.resolve();
        });
    }
}
