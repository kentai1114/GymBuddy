import Foundation
import UIKit
import WebKit
import Capacitor

@objc(YoutubeEmbedPlugin)
public class YoutubeEmbedPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "YoutubeEmbedPlugin"
    public let jsName = "YoutubeEmbed"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

    @objc func open(_ call: CAPPluginCall) {
        guard let videoId = call.getString("videoId")?.trimmingCharacters(in: .whitespacesAndNewlines),
              !videoId.isEmpty else {
            call.reject("missing videoId")
            return
        }

        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController else {
                call.reject("no view controller")
                return
            }
            let player = YoutubePlayerViewController(videoId: videoId)
            let nav = UINavigationController(rootViewController: player)
            nav.modalPresentationStyle = .pageSheet
            presenter.present(nav, animated: true) {
                call.resolve()
            }
        }
    }
}

final class YoutubePlayerViewController: UIViewController {
    private let videoId: String
    private var webView: WKWebView!

    init(videoId: String) {
        self.videoId = videoId
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        title = "示範"
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            title: "完成",
            style: .done,
            target: self,
            action: #selector(close)
        )

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        if #available(iOS 15.0, *) {
            let prefs = WKWebpagePreferences()
            prefs.allowsContentJavaScript = true
            config.defaultWebpagePreferences = prefs
        }

        webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.bounces = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        let url = URL(string: "https://www.youtube.com/embed/\(videoId)?playsinline=1&rel=0&modestbranding=1&autoplay=1")!
        var request = URLRequest(url: url)
        request.setValue("https://www.youtube.com", forHTTPHeaderField: "Referer")
        webView.load(request)
    }

    @objc private func close() {
        dismiss(animated: true)
    }
}
