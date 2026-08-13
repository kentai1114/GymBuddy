package app.gymbuddy;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(YoutubeEmbedPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
