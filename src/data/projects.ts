import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";


export type CodeFile = {
    /** 按鈕上顯示的名稱 */
    name: string;
    /** 這段程式碼負責的功能說明 */
    summary: string;
    code: string;
};

export type VideoFile = {
    /** 按鈕上顯示的名稱 */
    name: string;
    /** 這段影片展示的功能說明 */
    summary?: string;
    /** 放置在 public/videos/ 的影片檔，例如 /videos/ewova.mp4 */
    url: string;
};

export type Project = {
    id: string;
    title: string;
    tagline: string;
    year: string;
    role: string;
    engine: string;
    platforms: string[];
    tags: string[];
    poster: string;
    /** 多個功能影片，可在詳細視窗中切換播放 */
    videoFiles?: VideoFile[];
    overview: string;
    highlights: string[];
    codeFiles: CodeFile[];
};

export const projects: Project[] = [
    {
        id: "ewova",
        title: "VR多人連線專案",
        tagline: "多人連線 VR 教育平台：畫筆同步、個人房間與寵物商店",
        year: "\n",
        role: "",
        engine: "Unity · VR",
        platforms: ["VR", "PC"],
        tags: ["多人連線", "VR", "狀態同步"],
        poster: project1,
        videoFiles: [
            { name: "畫圖功能", url: "/videos/ewova-1.mp4" },
            { name: "畫圖同步", url: "/videos/ewova-2.mp4" },
            { name: "造型切換", url: "/videos/ewova-3.mp4" },
            { name: "伺服器世界選單", url: "/videos/ewova-4.mp4" },
            { name: "寵物商店", url: "/videos/ewova-5.mp4" },
            { name: "寵物功能", url: "/videos/ewova-6.mp4" },
        ],

        overview:
            "教育導向的多人連線VR專案，我負責核心多人連線功能的實作與整合，包含跨使用者的即時繪圖同步、個人房間系統，以及寵物與寵物商店的購買、選擇與交易流程。",
        highlights: [
            "獨立製作多人連線畫筆與筆畫即時同步，處理延遲補償與後進玩家的歷史筆畫重建",
            "個人房間系統：房間資料存讀、角色造型切換、家具/物件擺放與跨場景載入",
            "寵物系統與寵物商店：購買、選擇、交易與資料持久化",
            "整合多人連線架構，統一玩家狀態、角色化身與場景同步流程",
        ],
        codeFiles: [
            {
                name: "NetworkDrawingSync.cs",
                summary: "多人即時筆觸同步",
                code: `namespace VirtualSpace.NetworkDrawing
{
    using System.Collections;
    using System.Collections.Generic;
    using Photon.Pun;
    using UnityEngine;

    /// <summary>
    /// 多人即時筆觸同步組件 
    /// </summary>
    [RequireComponent(typeof(PhotonView))]
    public class NetworkDrawingSync : MonoBehaviourPun
    {
        [System.Serializable]
        public class BufferedStroke
        {
            public int StrokeId;
            public Color StrokeColor;
            public float BrushSize;
            public Vector3[] Points;
        }

        [Header("Late-Joiner 歷史筆觸緩衝")]
        private readonly List<BufferedStroke> m_lateJoinerBuffer = new();
        private readonly Dictionary<int, LineRenderer> m_renderedStrokes = new();
        private bool m_isReadyToRender = false;

        private void Start()
        {
            // 延遲啟用以確保場景與本地 Avatar 實體完成就緒
            StartCoroutine(InitSyncRoutine());
        }

        private IEnumerator InitSyncRoutine()
        {
            yield return new WaitForSeconds(0.5f);
            m_isReadyToRender = true;

            // 批次繪製進房前已收到的緩衝歷史筆觸
            foreach (var stroke in m_lateJoinerBuffer)
            {
                RenderFullStroke(stroke);
            }
            m_lateJoinerBuffer.Clear();
        }

        /// <summary>
        /// 本地完成筆觸後，透過 RPC 廣播至所有遠端客戶端 (支援後進玩家緩衝)
        /// </summary>
        public void BroadcastStroke(int strokeId, Color color, float size, Vector3[] points)
        {
            if (points == null || points.Length == 0) return;

            photonView.RPC(
                nameof(RPC_SyncStroke),
                RpcTarget.OthersBuffered,
                strokeId,
                color.r,
                color.g,
                color.b,
                color.a,
                size,
                points
            );
        }

        /// <summary>
        /// 接收遠端客戶端廣播之筆觸資料
        /// </summary>
        [PunRPC]
        private void RPC_SyncStroke(int strokeId, float r, float g, float b, float a, float size, Vector3[] points)
        {
            var stroke = new BufferedStroke
            {
                StrokeId = strokeId,
                StrokeColor = new Color(r, g, b, a),
                BrushSize = size,
                Points = points
            };

            // 若本地場景尚未初始化完成，先加入緩衝隊列
            if (!m_isReadyToRender)
            {
                m_lateJoinerBuffer.Add(stroke);
                return;
            }

            RenderFullStroke(stroke);
        }

        /// <summary>
        /// 動態生成 LineRenderer 實體並賦予頂點資料
        /// </summary>
        private void RenderFullStroke(BufferedStroke stroke)
        {
            if (stroke.Points == null || stroke.Points.Length == 0) return;

            GameObject lineObj = new GameObject($"NetworkStroke_{stroke.StrokeId}");
            lineObj.transform.SetParent(transform);

            var lineRenderer = lineObj.AddComponent<LineRenderer>();
            lineRenderer.useWorldSpace = true;
            lineRenderer.startWidth = stroke.BrushSize;
            lineRenderer.endWidth = stroke.BrushSize;
            lineRenderer.startColor = stroke.StrokeColor;
            lineRenderer.endColor = stroke.StrokeColor;
            lineRenderer.positionCount = stroke.Points.Length;
            lineRenderer.SetPositions(stroke.Points);

            m_renderedStrokes[stroke.StrokeId] = lineRenderer;
        }

        /// <summary>
        /// 清空特定筆觸或整體畫布
        /// </summary>
        public void ClearAllStrokes()
        {
            foreach (var kvp in m_renderedStrokes)
            {
                if (kvp.Value != null)
                {
                    Destroy(kvp.Value.gameObject);
                }
            }
            m_renderedStrokes.Clear();
            m_lateJoinerBuffer.Clear();
        }
    }
}`,
            },
            {
                name: "PetShopManager.cs",
                summary: "空間寵物商店",
                code: `namespace VirtualSpace.ShopSystem
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using Cysharp.Threading.Tasks;
    using UnityEngine;

    /// <summary>
    /// 寵物商店管理器
    /// </summary>
    public class PetShopManager : MonoBehaviour
    {
        [Header("寵物模型展示平台設定")]
        [SerializeField] private Transform m_platformAnchor;
        [SerializeField] private float m_modelSpacing = 1.2f;
        [SerializeField] private int m_maxCartCapacity = 4;

        [Header("錢包設定")]
        [SerializeField] private int m_currentWalletBalance = 1000;

        private readonly List<ShopItemData> m_cartItems = new();
        private readonly List<GameObject> m_spawnedModels = new();
        private CancellationTokenSource m_cts;

        public event Action<int> OnWalletBalanceChanged;
        public event Action<int, int> OnCartCountChanged; // (當前數量, 最大容量)
        public event Action<string> OnTransactionMessage;

        private void Awake()
        {
            m_cts = new CancellationTokenSource();
        }

        private void Start()
        {
            OnWalletBalanceChanged?.Invoke(m_currentWalletBalance);
            OnCartCountChanged?.Invoke(m_cartItems.Count, m_maxCartCapacity);
        }

        /// <summary>
        /// 加入購物車並於平台動態生成模型與重新等距排版
        /// </summary>
        public void AddItemToCart(ShopItemData data, GameObject modelPrefab)
        {
            if (m_cartItems.Count >= m_maxCartCapacity)
            {
                OnTransactionMessage?.Invoke("購物車已達最大容量！");
                return;
            }

            if (modelPrefab == null)
            {
                Debug.LogError($"[ShopManager] 找不到對應的 Prefab: {data.Name}");
                return;
            }

            m_cartItems.Add(data);
            GameObject spawnedModel = Instantiate(modelPrefab, m_platformAnchor);
            m_spawnedModels.Add(spawnedModel);

            UpdatePlatform3DLayout();
            OnCartCountChanged?.Invoke(m_cartItems.Count, m_maxCartCapacity);
        }

        /// <summary>
        /// 平台空間排列演算法
        /// </summary>
        private void UpdatePlatform3DLayout()
        {
            int count = m_spawnedModels.Count;
            if (count == 0) return;

            float totalWidth = (count - 1) * m_modelSpacing;
            float startX = -totalWidth / 2f;

            for (int i = 0; i < count; i++)
            {
                if (m_spawnedModels[i] == null) continue;

                Vector3 targetLocalPos = new Vector3(startX + (i * m_modelSpacing), 0, 0);
                m_spawnedModels[i].transform.localPosition = targetLocalPos;
                m_spawnedModels[i].transform.localRotation = Quaternion.identity;
            }
        }

        /// <summary>
        /// 執行非同步批次結帳流程 
        /// </summary>
        public async UniTask CheckoutAsync()
        {
            int totalCost = m_cartItems.Sum(x => x.Price);

            if (m_cartItems.Count == 0 || m_currentWalletBalance < totalCost)
            {
                OnTransactionMessage?.Invoke("餘額不足或購物車為空！");
                return;
            }

            OnTransactionMessage?.Invoke("交易處理中...");

            var pendingPurchases = new List<ShopItemData>(m_cartItems);
            int successCount = 0;
            List<string> failedItemNames = new();

            //  逐項非同步購買 
            foreach (var item in pendingPurchases)
            {
                bool isSuccess = await MockNetworkClient.PurchaseItemAsync(item.Id, m_cts.Token);
                if (isSuccess)
                {
                    successCount++;
                    m_currentWalletBalance -= item.Price;
                    OnWalletBalanceChanged?.Invoke(m_currentWalletBalance);
                }
                else
                {
                    failedItemNames.Add(item.Name);
                }
            }

            // 交易結果反饋與平台重置
            ClearCart();

            if (failedItemNames.Count == 0)
            {
                OnTransactionMessage?.Invoke($"成功購買 {successCount} 隻寵物！");
            }
            else
            {
                OnTransactionMessage?.Invoke($"部分商品購買失敗: {string.Join(", ", failedItemNames)}");
            }
        }

        /// <summary>
        /// 清空購物車與平台模型
        /// </summary>
        public void ClearCart()
        {
            foreach (var model in m_spawnedModels)
            {
                if (model != null) Destroy(model);
            }
            m_spawnedModels.Clear();
            m_cartItems.Clear();
            OnCartCountChanged?.Invoke(0, m_maxCartCapacity);
        }

        private void OnDestroy()
        {
            // 銷毀時安全中斷在途非同步請求
            m_cts?.Cancel();
            m_cts?.Dispose();
        }
    }

    /// <summary>
    /// 商店商品資料實體
    /// </summary>
    [Serializable]
    public class ShopItemData
    {
        public string Id;
        public string Name;
        public int Price;

        public ShopItemData(string id, string name, int price)
        {
            Id = id;
            Name = name;
            Price = price;
        }
    }

    /// <summary>
    /// 模擬後端非同步網絡服務
    /// </summary>
    public static class MockNetworkClient
    {
        public static async UniTask<bool> PurchaseItemAsync(string itemId, CancellationToken ct)
        {
            await UniTask.Delay(300, cancellationToken: ct);
            return true;
        }
    }
}`,
            },
            {
                name: "MenuController.cs",
                summary: "3D 空間弧形卡片輪播",
                code: `namespace VirtualSpace.UI
{
    using System;
    using System.Collections.Generic;
    using UnityEngine;

    /// <summary>
    /// 3D 空間弧形卡片輪播控制器 
    /// </summary>
    public class MenuController : MonoBehaviour
    {
        [Serializable]
        public struct CarouselSlot
        {
            [Tooltip("空間 Y 軸高度")]
            public float YPosition;

            [Tooltip("空間 Z 軸深度 (景深層次)")]
            public float ZPosition;

            [Tooltip("目標透明度 (0 ~ 1)")]
            [Range(0f, 1f)]
            public float CanvasAlpha;
        }

        [Header("3D 軌跡設定 (預設以索引 2 為中心點)")]
        [SerializeField]
        private CarouselSlot[] m_fixedSlots = new CarouselSlot[5]
        {
            new CarouselSlot { YPosition = -120f, ZPosition = 80f, CanvasAlpha = 0.3f },
            new CarouselSlot { YPosition = -60f,  ZPosition = 40f, CanvasAlpha = 0.7f },
            new CarouselSlot { YPosition = 0f,    ZPosition = 0f,  CanvasAlpha = 1.0f }, // 中心焦點槽位
            new CarouselSlot { YPosition = 60f,   ZPosition = 40f, CanvasAlpha = 0.7f },
            new CarouselSlot { YPosition = 120f,  ZPosition = 80f, CanvasAlpha = 0.3f }
        };

        [Header("平滑過渡動畫")]
        [SerializeField]
        [Range(1f, 30f)]
        private float m_animationSpeed = 10f;

        [Header("卡片清單")]
        [SerializeField]
        private List<MenuItemCard> m_currentCards = new();

        private int m_currentFocusIndex = 0;

        /// <summary>
        /// 初始化卡片清單並綁定懸停事件
        /// </summary>
        public void SetupCards(List<MenuItemCard> cards)
        {
            m_currentCards = new List<MenuItemCard>(cards);
            m_currentFocusIndex = 0;

            foreach (var card in m_currentCards)
            {
                if (card == null) continue;
                card.OnHoverAction -= OnCardHovered;
                card.OnHoverAction += OnCardHovered;
            }

            if (m_currentCards.Count > 0)
            {
                UpdateHierarchySorting();
            }
        }

        /// <summary>
        /// 接收滑鼠或 VR 射線懸停事件，動態更新焦點卡片
        /// </summary>
        public void OnCardHovered(MenuItemCard hoveredCard)
        {
            int index = m_currentCards.IndexOf(hoveredCard);
            if (index != -1 && index != m_currentFocusIndex)
            {
                m_currentFocusIndex = index;
                UpdateHierarchySorting();
            }
        }

        /// <summary>
        /// 根據當前焦點更新 UI 渲染階層，避免前後遮擋穿模
        /// </summary>
        private void UpdateHierarchySorting()
        {
            for (int i = 0; i < m_currentCards.Count; i++)
            {
                var card = m_currentCards[i];
                if (card == null) continue;

                if (i == m_currentFocusIndex)
                {
                    card.transform.SetAsLastSibling(); // 焦點卡片置頂渲染
                }
                else
                {
                    card.transform.SetAsFirstSibling(); // 非焦點置底
                }
            }
        }

        private void Update()
        {
            if (m_currentCards == null || m_currentCards.Count == 0 || m_fixedSlots.Length != 5)
                return;

            float dt = Time.deltaTime * m_animationSpeed;

            for (int i = 0; i < m_currentCards.Count; i++)
            {
                MenuItemCard card = m_currentCards[i];
                if (card == null) continue;

                Transform visualTransform = card.VisualTransform != null ? card.VisualTransform : card.transform;

                // 計算相對於焦點卡片的偏移量 (中心槽位為 2)
                int offset = i - m_currentFocusIndex;
                int targetSlotIndex = 2 + offset;

                // 超出 5 個可視槽位範圍則進行視錐剔除
                if (targetSlotIndex < 0 || targetSlotIndex >= m_fixedSlots.Length)
                {
                    visualTransform.gameObject.SetActive(false);
                    continue;
                }

                visualTransform.gameObject.SetActive(true);
                CarouselSlot targetSlot = m_fixedSlots[targetSlotIndex];

                // 平滑插值 3D 空間位置 (Y 軸高度與 Z 軸景深)
                Vector3 currentPos = visualTransform.localPosition;
                Vector3 targetPos = new Vector3(currentPos.x, targetSlot.YPosition, targetSlot.ZPosition);
                visualTransform.localPosition = Vector3.Lerp(currentPos, targetPos, dt);

                // 平滑插值 CanvasGroup 透明度
                if (card.CanvasGroup != null)
                {
                    card.CanvasGroup.alpha = Mathf.Lerp(card.CanvasGroup.alpha, targetSlot.CanvasAlpha, dt);
                }
            }
        }
    }

    /// <summary>
    /// 卡片項目基類
    /// </summary>
    public class MenuItemCard : MonoBehaviour
    {
        public Transform VisualTransform;
        public CanvasGroup CanvasGroup;
        public Action<MenuItemCard> OnHoverAction;

        public void TriggerHover() => OnHoverAction?.Invoke(this);
    }
}`,
      },
    ],
  },
  {
    id: "webgl-games",
    title: "WebGL網頁遊戲",
    tagline: "卡牌／問答／拼圖整合、後台 API 設定、網頁聲控遊戲",
    year: "\n",
    role: "Unity 工程師（主導開發）",
    engine: "Unity · WebGL",
    platforms: ["WebGL", "瀏覽器"],
    tags: ["WebGL", "API 串接", "多語系", "JS Interop"],
    poster: project2,
    videoFiles: [
      { name: "主要展示", url: "/videos/webgl.mp4" },
      { name: "卡牌遊戲", url: "/videos/webgl-card.mp4" },
      { name: "問答遊戲", url: "/videos/webgl-quiz.mp4" },
      { name: "聲控玩法", url: "/videos/webgl-voice.mp4" },
    ],
    overview:
      "主導 WebGL 網頁遊戲開發，將卡牌、問答、拼圖等多款獨立小遊戲整合進單一主程式架構，並設計不同模式的遊戲啟動邏輯。透過串接後端 API，讓網頁端可動態配置遊戲設定與內容，同時優化多語系字型顯示。另外實作以麥克風輸入操作的網頁聲控遊戲。",
    highlights: [
      "整合卡牌／問答／拼圖小遊戲至共用主程式，統一資源載入與場景生命週期",
      "串接後台 API 動態下發題庫、關卡與遊戲參數，免改版即可調整內容",
      "設計多模式啟動邏輯（單機／活動／預覽），由 URL 參數與後台設定決定",
      "優化多語系字型與 Fallback，解決 WebGL 中文缺字與包體膨脹問題",
      "以 JS Interop 取得麥克風音量，實作網頁聲控玩法",
    ],
    codeFiles: [
      {
        name: "GameBootstrapper.cs",
        summary: "多模式啟動邏輯：依後台設定載入對應小遊戲",
        code: `using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

public enum GameMode { Card, Quiz, Puzzle, Voice }

public class GameBootstrapper : MonoBehaviour
{
    [SerializeField] private RemoteConfigService config;
    [SerializeField] private LoadingView loading;

    private IEnumerator Start()
    {
        loading.Show("載入設定中…");

        yield return config.FetchAsync(); // 後台 API
        if (!config.IsReady) {
            loading.ShowError("無法取得遊戲設定");
            yield break;
        }

        LocalizationService.Apply(config.Language);

        var mode = Enum.TryParse(config.Mode, true, out GameMode m) ? m : GameMode.Card;
        var sceneName = mode switch
        {
            GameMode.Card => "Game_Card",
            GameMode.Quiz => "Game_Quiz",
            GameMode.Puzzle => "Game_Puzzle",
            GameMode.Voice => "Game_Voice",
            _ => "Game_Card",
        };

        var op = SceneManager.LoadSceneAsync(sceneName);
        while (!op.isDone) {
            loading.SetProgress(op.progress);
            yield return null;
        }
        loading.Hide();
    }
} `,
      },
      {
        name: "RemoteConfigService.cs",
        summary: "後台 API 串接：抓取網頁端的遊戲設定",
        code: `using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class GameConfigDto {
    public string mode;
    public string language;
    public int timeLimit;
    public string[] questionIds;
}

public class RemoteConfigService : MonoBehaviour
{
    [SerializeField] private string apiRoot = "https://api.example.com";

    public bool IsReady { get; private set; }
    public string Mode => _dto?.mode;
    public string Language => _dto?.language ?? "zh-TW";
    public GameConfigDto Data => _dto;

    private GameConfigDto _dto;

    public IEnumerator FetchAsync()
    {
        // WebGL 由網址參數帶入場次代碼
        var sessionId = WebGLQuery.Get("session");
        var url = $"{apiRoot}/game/config?session={sessionId}";

        using var req = UnityWebRequest.Get(url);
        req.timeout = 10;
        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success) {
            Debug.LogError($"[Config] {req.error}");
            IsReady = false;
            yield break;
        }

        _dto = JsonUtility.FromJson<GameConfigDto>(req.downloadHandler.text);
        IsReady = _dto != null;
    }
} `,
      },
      {
        name: "VoiceInput.cs",
        summary: "網頁聲控：取得麥克風音量並轉為遊戲輸入",
        code: `using UnityEngine;

public class VoiceInput : MonoBehaviour
{
    [SerializeField] private float threshold = 0.08f;
    [SerializeField] private float smoothing = 12f;

    private AudioClip _clip;
    private string _device;
    private float[] _samples = new float[256];

    public float Loudness { get; private set; }
    public bool IsShouting => Loudness > threshold;

    private void Start()
    {
        if (Microphone.devices.Length == 0) return;
        _device = Microphone.devices[0];
        _clip = Microphone.Start(_device, true, 1, 44100);
    }

    private void Update()
    {
        if (_clip == null) return;

        var position = Microphone.GetPosition(_device) - _samples.Length;
        if (position < 0) return;

        _clip.GetData(_samples, position);

        float sum = 0f;
        for (int i = 0; i < _samples.Length; i++) sum += _samples[i] * _samples[i];
        var rms = Mathf.Sqrt(sum / _samples.Length);

        Loudness = Mathf.Lerp(Loudness, rms, Time.deltaTime * smoothing);
    }
} `,
      },
    ],
  },
  {
    id: "udp-video-player",
    title: "UDP 影片播放器",
    tagline: "展場多螢幕影片同步控制，外部硬體/軟體即時操作",
    year: "\n",
    role: "Unity 工程師（展場專案）",
    engine: "Unity · UDP Socket",
    platforms: ["Windows", "展場裝置"],
    tags: ["UDP", "多螢幕"],
    poster: project3,
    videoFiles: [
      { name: "主要展示", url: "/videos/udp-player.mp4" },
      { name: "UDP 串流", url: "/videos/udp-stream.mp4" },
      { name: "展場控制", url: "/videos/udp-control.mp4" },
    ],
    overview:
      "為展場互動專案開發的影片播放器工具，透過 UDP 協定接收外部硬體或控制軟體的指令，控制個別螢幕的播放／暫停／停止與跳轉，達成多機播放的即時同步與高效流暢控制。",
    highlights: [
      "自訂輕量 UDP 指令協定（設備編號 + 指令 + 參數），延遲低於一個影格",
      "支援單機指定與全體廣播控制，播放/暫停/停止/跳轉/音量",
      "在背景執行緒接收封包並排入主執行緒佇列，避免 Unity API 跨執行緒錯誤",
      "提供設定介面配置埠號、設備編號與影片清單，現場不需改程式",
    ],
    codeFiles: [
      {
        name: "UdpCommandReceiver.cs",
        summary: "背景執行緒接收 UDP 封包並轉交主執行緒",
        code: `using System;
using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using UnityEngine;

public class UdpCommandReceiver : MonoBehaviour
{
    [SerializeField] private int port = 8899;

    public event Action < string > OnCommand;

    private UdpClient _client;
    private Thread _thread;
    private volatile bool _running;
    private readonly ConcurrentQueue < string > _queue = new ();

    private void Start()
    {
        _client = new UdpClient(port);
        _running = true;
        _thread = new Thread(ReceiveLoop) { IsBackground = true };
        _thread.Start();
        Debug.Log($"[UDP] listening on {port}");
    }

    private void ReceiveLoop()
    {
        var remote = new IPEndPoint(IPAddress.Any, 0);
        while (_running) {
            try {
                var bytes = _client.Receive(ref remote);
                _queue.Enqueue(Encoding.UTF8.GetString(bytes).Trim());
            }
            catch (SocketException) { /* 關閉時忽略 */ }
        }
    }

    private void Update()
    {
        while (_queue.TryDequeue(out var msg)) OnCommand?.Invoke(msg);
    }

    private void OnDestroy()
    {
        _running = false;
        _client?.Close();
        _thread?.Join(200);
    }
} `,
      },
      {
        name: "VideoCommandHandler.cs",
        summary: "指令解析：控制指定螢幕的播放/暫停/停止/跳轉",
        code: `using UnityEngine;
using UnityEngine.Video;

// 指令格式： "<deviceId>|<command>|<value>"   例： "2|SEEK|35.5"
public class VideoCommandHandler : MonoBehaviour
{
    [SerializeField] private int deviceId = 1;
    [SerializeField] private VideoPlayer player;
    [SerializeField] private UdpCommandReceiver receiver;

    private void OnEnable() => receiver.OnCommand += Handle;
    private void OnDisable() => receiver.OnCommand -= Handle;

    private void Handle(string raw)
    {
        var parts = raw.Split('|');
        if (parts.Length < 2) return;

        // 0 = 廣播給所有設備
        if (!int.TryParse(parts[0], out var target)) return;
        if (target != 0 && target != deviceId) return;

        var value = parts.Length > 2 ? parts[2] : string.Empty;

        switch (parts[1].ToUpperInvariant()) {
            case "PLAY": player.Play(); break;
            case "PAUSE": player.Pause(); break;
            case "STOP":
                player.Stop();
                player.time = 0;
                break;
            case "SEEK":
                if (double.TryParse(value, out var t)) player.time = t;
                break;
            case "VOLUME":
                if (float.TryParse(value, out var v))
                    player.SetDirectAudioVolume(0, Mathf.Clamp01(v));
                break;
            case "LOAD":
                player.url = System.IO.Path.Combine(Application.streamingAssetsPath, value);
                player.Prepare();
                break;
        }
    }
} `,
      },
    ],
  },
  {
    id: "space-dog-go",
    title: "太空狗狗 GO!",
    tagline: "畢業專題：飛盤換位解謎平台遊戲（競賽第三名）",
    year: "2022/11–2023/6",
    role: "程式設計／關卡設計（4 人團隊）",
    engine: "Unity",
    platforms: ["PC"],
    tags: ["解謎", "關卡設計", "平台跳躍", "團隊領導"],
    poster: project1,
    videoFiles: [
      { name: "主要展示", url: "/videos/space-dog.mp4" },
      { name: "解謎機關", url: "/videos/space-dog-puzzle.mp4" },
      { name: "引力裝置", url: "/videos/space-dog-gravity.mp4" },
    ],
    overview:
      "玩家扮演拿著飛盤的太空狗狗，核心玩法是丟出兩個飛盤進行物件與物件之間的「換位」。關卡中加入傳送門與引力裝置等機關供玩家解謎，操作簡單易上手。我負責程式設計與關卡設計，並提出更換遊戲提案促使團隊重新定位製作方向，最終獲得競賽第三名。",
    highlights: [
      "實作雙飛盤標記與物件換位（Swap）核心機制",
      "設計傳送門與引力裝置機關，並調整關卡難度曲線與遊戲平衡",
      "主導關卡設計與玩法改良，增加解謎元素提升耐玩度",
      "團隊由六人縮編為四人後仍完成專案並取得競賽第三名",
    ],
    codeFiles: [
      {
        name: "DiscSwapSystem.cs",
        summary: "雙飛盤核心機制：標記兩個目標並交換位置",
        code: `using UnityEngine;

public class DiscSwapSystem : MonoBehaviour
{
    [SerializeField] private Disc discA;
    [SerializeField] private Disc discB;
    [SerializeField] private float swapDuration = 0.25f;

    public bool CanSwap => discA.HasTarget && discB.HasTarget;

    public void Throw(int index, Vector3 origin, Vector3 direction)
    {
        var disc = index == 0 ? discA : discB;
        disc.Launch(origin, direction);
    }

    public void TrySwap()
    {
        if (!CanSwap) return;

        var a = discA.Target;
        var b = discB.Target;
        if (a == b) return;

        var posA = a.position;
        var posB = b.position;

        StartCoroutine(Move(a, posB));
        StartCoroutine(Move(b, posA));

        discA.Clear();
        discB.Clear();
    }

    private System.Collections.IEnumerator Move(Transform t, Vector3 to)
    {
        var body = t.GetComponent<Rigidbody>();
        if (body != null) body.isKinematic = true;

        var from = t.position;
        for (float e = 0f; e < swapDuration; e += Time.deltaTime)
        {
            t.position = Vector3.Lerp(from, to, e / swapDuration);
            yield return null;
        }
        t.position = to;

        if (body != null) {
            body.isKinematic = false;
            body.linearVelocity = Vector3.zero;
        }
    }
} `,
      },
      {
        name: "GravityDevice.cs",
        summary: "引力裝置：範圍內物件受吸引力並可反轉重力",
        code: `using UnityEngine;

[RequireComponent(typeof (SphereCollider))]
public class GravityDevice : MonoBehaviour
{
    [SerializeField] private float force = 25f;
    [SerializeField] private bool repel;
    [SerializeField] private AnimationCurve falloff =
        AnimationCurve.EaseInOut(0f, 1f, 1f, 0f);

    private SphereCollider _area;

    private void Awake()
    {
        _area = GetComponent<SphereCollider>();
        _area.isTrigger = true;
    }

    private void OnTriggerStay(Collider other)
    {
        var body = other.attachedRigidbody;
        if (body == null || body.isKinematic) return;

        var offset = transform.position - body.position;
        var t = Mathf.Clamp01(offset.magnitude / _area.radius);
        var strength = force * falloff.Evaluate(t);

        var dir = offset.normalized * (repel ? -1f: 1f);
        body.AddForce(dir * strength, ForceMode.Acceleration);
    }

    public void Toggle() => repel = !repel;
} `,
      },
      {
        name: "Portal.cs",
        summary: "傳送門：位置與速度方向的轉換傳送",
        code: `using UnityEngine;

public class Portal : MonoBehaviour
{
    [SerializeField] private Portal linked;
    [SerializeField] private Transform exit;
    [SerializeField] private float cooldown = 0.2f;

    private float _readyTime;

    private void OnTriggerEnter(Collider other)
    {
        if (linked == null || Time.time < _readyTime) return;

        var body = other.attachedRigidbody;
        if (body == null) return;

        linked.Receive(body);
        _readyTime = linked._readyTime = Time.time + cooldown;
    }

    public void Receive(Rigidbody body)
    {
        // 將入口的速度轉到出口的座標系
        var localVelocity = transform.InverseTransformDirection(body.linearVelocity);
        body.position = exit.position;
        body.linearVelocity = exit.TransformDirection(localVelocity);
        body.transform.rotation = exit.rotation;
    }
} `,
      },
    ],
  },
  {
    id: "vr-card-game",
    title: "VR 抽牌遊戲",
    tagline: "四選一隨機抽牌，累積金錢的 VR 小品",
    year: "2024",
    role: "Unity 工程師",
    engine: "Unity · XR Interaction Toolkit",
    platforms: ["VR"],
    tags: ["VR", "隨機抽牌", "互動"],
    poster: project2,
    videoFiles: [
      { name: "主要展示", url: "/videos/vr-card.mp4" },
      { name: "抽牌互動", url: "/videos/vr-card-draw.mp4" },
      { name: "特效演出", url: "/videos/vr-card-fx.mp4" },
    ],
    overview:
      "一款 VR 抽牌小遊戲，玩家從四張牌中隨機抽取一張，目標是抽到加分牌讓金錢越來越高。負責 VR 互動抓取、抽牌權重機制與結算流程。",
    highlights: [
      "以權重亂數控制加分／扣分牌的出現機率，維持刺激度",
      "VR 手把抓取與翻牌動畫、觸覺回饋整合",
      "金錢結算與連續加成規則",
    ],
    codeFiles: [
      {
        name: "CardDrawManager.cs",
        summary: "四選一抽牌：權重亂數與結算",
        code: `using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class CardOutcome {
    public string label;
    public int money;      // 正數加分、負數扣分
    public float weight = 1f;
}

public class CardDrawManager : MonoBehaviour
{
    [SerializeField] private List < CardOutcome > pool = new ();
    [SerializeField] private CardView[] cards = new CardView[4];

    public int Money { get; private set; }

    public void Deal()
    {
        foreach(var card in cards)
        card.Set(Roll());
    }

    public void Reveal(int index)
    {
        var outcome = cards[index].Outcome;
        Money = Mathf.Max(0, Money + outcome.money);
        cards[index].Flip();
        HapticFeedback.Play(outcome.money >= 0 ? 0.4f : 0.8f);
    }

    private CardOutcome Roll()
    {
        float total = 0f;
        foreach(var o in pool) total += o.weight;

        var pick = Random.Range(0f, total);
        foreach(var o in pool)
        {
            pick -= o.weight;
            if (pick <= 0f) return o;
        }
        return pool[^ 1];
    }
} `,
      },
    ],
  },
  {
    id: "ar-vr-proposal",
    title: "互動式產品介紹（AR / VR）",
    tagline: "B2B 商務提案用的 AR、VR 產品介紹原型",
    year: "2024–2026",
    role: "Unity 工程師（原型開發）",
    engine: "Unity · AR Foundation",
    platforms: ["Android APK", "VR"],
    tags: ["AR", "VR", "Android"],
    poster: project3,
    videoFiles: [
      { name: "主要展示", url: "/videos/ar-proposal.mp4" },
      { name: "AR 互動", url: "/videos/ar-proposal-ar.mp4" },
      { name: "VR 預覽", url: "/videos/ar-proposal-vr.mp4" },
    ],
    overview:
      "針對 B2B 提案與客戶需求快速建立的產品介紹原型，包含 AR 互動式產品介紹與 VR 互動式產品介紹，協助商務團隊進行概念驗證（POC）與產品展示。強調短時間內可展示、可調整的原型架構，並打包為 Android 手機／平板 APK 現場使用。",
    highlights: [
      "AR 平面偵測放置產品模型，支援縮放旋轉與熱點資訊",
      "VR 版本提供沉浸式產品導覽與零件拆解展示",
      "資料驅動的熱點與說明內容，換產品只需更換設定檔",
      "輸出 Android APK 供業務現場即時展示",
    ],
    codeFiles: [
      {
        name: "ARProductPlacer.cs",
        summary: "AR 平面偵測與產品模型放置",
        code: `using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

[RequireComponent(typeof (ARRaycastManager))]
public class ARProductPlacer : MonoBehaviour
{
    [SerializeField] private GameObject productPrefab;

    private ARRaycastManager _raycaster;
    private readonly List < ARRaycastHit > _hits = new ();
    private GameObject _instance;

    private void Awake() => _raycaster = GetComponent<ARRaycastManager>();

    private void Update()
    {
        if (Input.touchCount == 0) return;
        var touch = Input.GetTouch(0);
        if (touch.phase != TouchPhase.Began) return;

        if (!_raycaster.Raycast(touch.position, _hits, TrackableType.PlaneWithinPolygon))
            return;

        var pose = _hits[0].pose;
        if (_instance == null)
            _instance = Instantiate(productPrefab, pose.position, pose.rotation);
        else
            _instance.transform.SetPositionAndRotation(pose.position, pose.rotation);
    }
} `,
      },
      {
        name: "ProductHotspot.cs",
        summary: "資料驅動熱點：點擊顯示零件說明",
        code: `using UnityEngine;

[System.Serializable]
public class HotspotData {
    public string id;
    public string title;
    [TextArea] public string description;
    public Vector3 localPosition;
}

public class ProductHotspot : MonoBehaviour
{
    [SerializeField] private HotspotConfig config;   // ScriptableObject
    [SerializeField] private Transform anchorRoot;
    [SerializeField] private HotspotMarker markerPrefab;
    [SerializeField] private InfoPanel panel;

    private void Start()
    {
        foreach(var data in config.hotspots)
        {
            var marker = Instantiate(markerPrefab, anchorRoot);
            marker.transform.localPosition = data.localPosition;
            marker.Bind(data, Show);
        }
    }

    private void Show(HotspotData data) => panel.Show(data.title, data.description);
} `,
      },
    ],
  },
];
