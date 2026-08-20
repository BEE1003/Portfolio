


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
    /** 放置在 public/videos/ 的影片檔，例如 /videos/multiverse.mp4 */
    url: string;
    /** 圖片與 YouTube 素材會在專案詳情中以對應播放器顯示。 */
    type?: "image" | "youtube";
    /** 影片播放前顯示的預覽封面圖路徑 */
    poster?: string;
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
    poster?: string;
    /** 作品集卡片封面圖，設定後卡片只顯示靜態圖不播影片 */
    cardPoster?: string;
    /** 多個功能影片，可在詳細視窗中切換播放 */
    videoFiles?: VideoFile[];
    overview: string;
    highlights: string[];
    codeFiles: CodeFile[];
};

export const projects: Project[] = [
    {
        id: "multiverse",
        title: "VR多人連線專案",
        tagline: "多人連線 VR 教育平台：畫筆同步、個人房間與寵物商店",
        year: "\n",
        role: "",
        engine: "Unity · VR",
        platforms: ["VR", "PC"],
        tags: ["多人連線", "VR", "狀態同步"],
        poster: "",
        videoFiles: [
            { name: "畫圖功能", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/multiverse-1.mp4" },
            { name: "畫圖同步", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/multiverse-2.mp4" },
            { name: "造型切換", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/multiverse-3.mp4" },
            { name: "伺服器世界選單", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/multiverse-4.mp4" },
            { name: "寵物商店", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/multiverse-5.mp4" },
            { name: "寵物功能", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/multiverse-6.mp4" },
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
    tagline: "卡牌／問答／拼圖整合、後台 API 設定、多語系框架",
    year: "\n",
    role: "",
    engine: "Unity · WebGL",
    platforms: ["WebGL", "PC"],
    tags: ["WebGL", "API 串接", "多語系", "資料載入"],
    poster: "",
    videoFiles: [
      { name: "卡牌遊戲", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/card-game.mp4" },
      { name: "拼圖遊戲", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/puzzle-game.mp4" },
      { name: "問答遊戲後台模式", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/quiz-game.mp4" },
      { name: "問答遊戲後台設定", url: "/media/webgl/quiz-admin-settings.png", type: "image" },
      { name: "獎勵資料後台設定", url: "/media/webgl/reward-admin-settings.png", type: "image" },
      { name: "多語系套件", url: "/media/webgl/i2-localization-package.png", type: "image" },
    ],
    overview:
      "主導 WebGL 網頁遊戲開發，將卡牌、問答、拼圖等多款獨立小遊戲整合進單一主程式架構，並設計不同模式的遊戲啟動邏輯。透過串接後端 API，讓網頁端可動態配置遊戲設定與內容，同時優化多語系字型顯示。",
    highlights: [
      "整合卡牌／問答／拼圖小遊戲至共用主程式，統一資源載入與場景生命週期",
      "串接後台 API 動態下發題庫、關卡與遊戲參數，免改版即可調整內容",
      "設計多模式啟動邏輯（API／S3／本地），由遊戲讀取參數決定",
      "優化多語系字型與 Fallback，解決 WebGL 中文缺字問題",
    ],
    codeFiles: [
      {
        name: "GameConfigApiClient.cs",
        summary: "後台管理器：帶入授權資訊，取得並反序列化遊戲與獎勵設定",
        code: `using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class GameConfigResponse
{
    // 後台回應統一包裝：success 決定是否可使用 data。
    public bool success;
    public string message;
    public GameSettings data;
}

public class GameSettings
{
    // 不同遊戲共用同一份設定回應，再由對應遊戲管理器取用自身區塊。
    public CardSettings card;
    public QuizSettings quiz;
    public PuzzleSettings puzzle;
    public PrizeSettings prize;
}

public sealed class GameConfigApiClient
{
    private readonly string _apiRoot;
    private readonly string _accessToken;

    public GameConfigApiClient(string apiRoot, string accessToken)
    {
        _apiRoot = apiRoot;
        _accessToken = accessToken;
    }

    public async Task<GameConfigResponse> FetchAsync(string projectKey)
    {
        // 將網頁端提供的專案識別轉為後台可讀取的 JSON 請求內容。
        var payload = JsonUtility.ToJson(new ConfigRequest { projectKey = projectKey });
        using var request = new UnityWebRequest($"{_apiRoot}/game-config", "POST");
        request.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(payload));
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        if (!string.IsNullOrEmpty(_accessToken))
            request.SetRequestHeader("Authorization", $"Bearer {_accessToken}");

        // UnityWebRequest 不支援直接 await；以 Task.Yield 等待請求完成。
        var operation = request.SendWebRequest();
        while (!operation.isDone) await Task.Yield();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogWarning($"取得遊戲設定失敗：{request.error}");
            return null;
        }

        // 回傳統一的資料傳輸物件，讓卡牌、問答與拼圖共用同一份後台設定。
        return JsonUtility.FromJson<GameConfigResponse>(request.downloadHandler.text);
    }

    [Serializable]
    private class ConfigRequest { public string projectKey; }
} `,
      },
      {
        name: "GameManager.cs",
        summary: "共用遊戲管理器：啟動時依序嘗試 API → S3 → 本地 CSV 的資料來源降級流程",
        code: `using System.Threading.Tasks;
using UnityEngine;

public enum ContentSource { Api, S3, LocalCsv }

public abstract class GameManager : MonoBehaviour
{
    protected string ProjectKey { get; private set; }
    protected string Language { get; private set; } = "zh-TW";
    protected string AccessToken { get; private set; }
    protected ContentSource Source { get; private set; }

    private bool _hasProjectKey;
    private bool _canUseApi;

    protected virtual void Start()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        // 由外層網頁注入專案識別、語系與授權資料。
        Application.ExternalCall("RequestLaunchContext");
#else
        ReceiveLaunchContext("preview", "zh-TW", "");
#endif
    }

    public void ReceiveLaunchContext(string projectKey, string language, string accessToken)
    {
        // 對 WebView 傳入值做最小清理，避免包裝 JSON 的殘餘字元影響流程。
        ProjectKey = Sanitize(projectKey);
        Language = string.IsNullOrWhiteSpace(language) ? "zh-TW" : language;
        AccessToken = Sanitize(accessToken);

        // 網頁端未帶值時，沿用上一次保存的啟動資訊以支援本地 CSV fallback。
        if (string.IsNullOrEmpty(ProjectKey)) ProjectKey = PlayerPrefsGameState.ProjectId;
        if (string.IsNullOrEmpty(language)) Language = PlayerPrefsGameState.Language;

        // Project 與語系需要跨次啟動保留；Token 僅留在記憶體，不寫入 PlayerPrefs。
        PlayerPrefsGameState.SaveLaunchContext(ProjectKey, Language);
        _hasProjectKey = !string.IsNullOrEmpty(ProjectKey);
        _canUseApi = !string.IsNullOrEmpty(AccessToken);
        TryInitialize();
    }

    private async void TryInitialize()
    {
        // 專案識別是三種來源共用的必要條件；Token 僅影響 API 是否可用。
        if (!_hasProjectKey) return;
        await InitializeAsync();
    }

    protected async Task InitializeAsync()
    {
        ShowLoading(true);
        // 優先取得後台即時設定；失敗則取遠端 S3 備援，最後使用本地 CSV。
        var loaded = (_canUseApi && await TryLoadAsync(ContentSource.Api))
                  || await TryLoadAsync(ContentSource.S3)
                  || await TryLoadAsync(ContentSource.LocalCsv);

        if (loaded) await BuildGameAsync();
        else ShowLoadError();
        ShowLoading(false);
    }

    private async Task<bool> TryLoadAsync(ContentSource source)
    {
        // 子類別只需實作資料來源，啟動與 fallback 流程由共用基類維護。
        Source = source;
        return source switch
        {
            ContentSource.Api => await LoadFromApiAsync(),
            ContentSource.S3 => await LoadFromS3Async(),
            _ => await LoadFromLocalCsvAsync(),
        };
    }

    protected abstract Task<bool> LoadFromApiAsync();
    // 各遊戲僅實作三個資料來源與建置邏輯，啟動順序由共用基類統一維護。
    protected abstract Task<bool> LoadFromS3Async();
    protected abstract Task<bool> LoadFromLocalCsvAsync();
    protected abstract Task BuildGameAsync();

    private static string Sanitize(string value) =>
        string.IsNullOrWhiteSpace(value) ? "" : value.Trim().Trim('"', '}', ']');

    protected virtual void ShowLoading(bool visible) { }
    protected virtual void ShowLoadError() { }
} `,
      },
      {
        name: "CardGameManager.cs",
        summary: "卡牌遊戲實作：繼承共用載入流程，轉換後台資料並套用語系與遊戲參數",
        code: `using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UnityEngine;

public class CardGameManager : GameManager
{
    // 可在 Inspector 調整的預設值，後台未提供設定時作為安全 fallback。
    [SerializeField] private string apiRoot;
    [SerializeField] private CardBoard board;
    [SerializeField] private int defaultPairCount = 6;
    [SerializeField] private int defaultTimeLimit = 60;

    private readonly List<LocalizedCardSet> _cardSets = new();
    private CardSettings _settings;

    protected override async Task<bool> LoadFromApiAsync()
    {
        // 透過共用 API Client 取得設定，卡牌類別只處理自己的設定區塊。
        var client = new GameConfigApiClient(apiRoot, AccessToken);
        var response = await client.FetchAsync(ProjectKey);
        if (response?.success != true || response.data?.card == null) return false;

        _settings = response.data.card;
        _cardSets.Clear();
        foreach (var group in _settings.localizedContent)
        {
            // 後台資料依語系分組，轉成遊戲內部使用的卡牌資料模型。
            _cardSets.Add(new LocalizedCardSet
            {
                language = group.language,
                cards = group.cards.Select(item => new CardData
                {
                    id = item.id,
                    title = item.title,
                    description = item.description,
                    imageUrl = item.imageUrl,
                }).ToList(),
            });
        }
        return _cardSets.Count > 0;
    }

    protected override async Task BuildGameAsync()
    {
        // 精確語系 → 語系前綴 → 英文，降低缺少翻譯時的中斷風險。
        var cards = FindCardsForLanguage(Language);
        if (cards == null || cards.Count == 0)
        {
            Debug.LogWarning("找不到目前語系的卡牌資料。");
            return;
        }

        // 後台數值仍須依實際資料筆數限制，避免產生不存在的配對。
        var pairCount = Mathf.Clamp(
            _settings?.pairCount > 0 ? _settings.pairCount : defaultPairCount,
            1,
            cards.Count);
        var timeLimit = _settings?.timeLimit > 0 ? _settings.timeLimit : defaultTimeLimit;

        // 後台下發的遊戲參數同步保存，切換至 S3／本地 CSV 時可沿用最後有效設定。
        PlayerPrefsGameState.CardTimeLimit = timeLimit;

        await board.InitializeAsync(cards, pairCount, timeLimit);
    }

    private List<CardData> FindCardsForLanguage(string language)
    {
        // 例如 zh-TW 找不到時會改找 zh，再退回英文資料。
        var shortCode = language.Split('-')[0];
        return _cardSets.FirstOrDefault(set => set.language == language)?.cards
            ?? _cardSets.FirstOrDefault(set => set.language.StartsWith(shortCode))?.cards
            ?? _cardSets.FirstOrDefault(set => set.language.StartsWith("en"))?.cards;
    }

    // API 無法使用時，沿用基類定義的 S3 → 本地 CSV 備援順序。
    protected override Task<bool> LoadFromS3Async() => Task.FromResult(false);
    protected override Task<bool> LoadFromLocalCsvAsync() => Task.FromResult(false);
} `,
      },
      {
        name: "CsvGameDataLoader.cs",
        summary: "CSV 資料載入：支援本機／S3 文字來源、清除 BOM，並將資料分組為多語系內容",
        code: `using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

public static class CsvGameDataLoader
{
    public static async Task<Dictionary<string, List<CardData>>> LoadAsync(
        ContentSource source, string location, Func<string, Task<string>> loadFromS3)
    {
        // 依 source 僅擇一取得資料；csv 是統一的暫存輸入，不會同時保留兩份資料。
        var csv = source == ContentSource.S3
            ? await loadFromS3(location)
            : await File.ReadAllTextAsync(location);

        if (string.IsNullOrWhiteSpace(csv)) return null;

        // UTF-8 BOM 與 CRLF 會影響欄位判斷，先統一正規化內容。
        var rows = csv.TrimStart('\uFEFF').Replace("\r", "")
            .Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (rows.Length <= 1) return null;

        var cards = new List<CardData>();
        for (var rowIndex = 1; rowIndex < rows.Length; rowIndex++)
        {
            var columns = rows[rowIndex].Split(',');
            if (columns.Length < 4) continue;

            cards.Add(new CardData
            {
                language = columns[0].Trim(),
                title = columns[1].Trim(),
                imageUrl = columns[2].Trim(),
                description = columns[3].Trim(),
            });
        }

        // 依語系分組，讓遊戲管理器可沿用同一套語系 fallback 邏輯。
        return cards.GroupBy(card => card.language)
            .ToDictionary(group => group.Key, group => group.ToList());
    }
} `,
      },
      {
        name: "PlayerPrefsGameState.cs",
        summary: "本機狀態管理：集中保存語系、音量、遊戲參數與目前專案識別，並提供預設值",
        code: `using UnityEngine;

public static class PlayerPrefsGameState
{
    private const string LanguageKey = "game.language";
    private const string ProjectKey = "game.project";
    private const string CardTimeKey = "card.timeLimit";
    private const string PuzzleCountKey = "puzzle.pieceCount";
    private const string SfxVolumeKey = "audio.sfxVolume";
    private const string BgmVolumeKey = "audio.bgmVolume";

    // 設定值以屬性封裝，避免各遊戲散落字串 key 與預設值。
    public static string Language
    {
        get => PlayerPrefs.GetString(LanguageKey, "zh-TW");
        set => PlayerPrefs.SetString(LanguageKey, value);
    }

    public static string ProjectId
    {
        get => PlayerPrefs.GetString(ProjectKey, "");
        set => PlayerPrefs.SetString(ProjectKey, value);
    }

    public static void SaveLaunchContext(string projectId, string language)
    {
        ProjectId = projectId;
        Language = language;
        PlayerPrefs.Save();
    }

    public static float CardTimeLimit
    {
        get => PlayerPrefs.GetFloat(CardTimeKey, 60f);
        set => PlayerPrefs.SetFloat(CardTimeKey, Mathf.Clamp(value, 10f, 300f));
    }

    public static int PuzzlePieceCount
    {
        get => PlayerPrefs.GetInt(PuzzleCountKey, 4);
        set => PlayerPrefs.SetInt(PuzzleCountKey, Mathf.Max(4, value));
    }

    public static void SaveAudio(float sfxVolume, float bgmVolume)
    {
        PlayerPrefs.SetFloat(SfxVolumeKey, Mathf.Clamp01(sfxVolume));
        PlayerPrefs.SetFloat(BgmVolumeKey, Mathf.Clamp01(bgmVolume));
        PlayerPrefs.Save(); // 在設定畫面確認後才寫入磁碟，減少 I/O 次數。
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
    role: "",
    engine: "Unity · UDP Socket",
    platforms: ["PC"],
    tags: ["UDP", "多螢幕"],
    poster: "/media/udp/UDPCtrl.jpg",
    cardPoster: "/media/udp/UDPCtrl.jpg",
    videoFiles: [
      { name: "設定介面", url: "/media/udp/UDPSet.jpg", type: "image" },
      { name: "控制介面", url: "/media/udp/UDPCtrl.jpg", type: "image" },
      { name: "影片播放", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/UDP.mp4", poster: "/media/udp/UDPCtrl.jpg" },
    ],
    overview:
      "為展場互動專案開發的影片播放器工具，透過 UDP 協定接收外部硬體或控制軟體的指令，控制個別螢幕的播放／暫停／停止，達成多機播放個別影片的即時同步與高效流暢控制。",
    highlights: [
      "自訂輕量 UDP 指令協定，以設備編號、指令與參數組成簡潔封包格式",
      "支援單機指定控制電腦個別螢幕，可即時執行播放、暫停、停止等影片操作",
      "提供自訂影片播放清單介面，讓使用者直接新增、刪除、修改播放內容，無需改程式",
    ],
    codeFiles: [],
  },
  {
    id: "space-dog-go",
    title: "太空狗狗 GO!",
    tagline: "畢業專題：飛盤換位解謎平台遊戲",
    year: "2022/11–2023/6",
    role: "",
    engine: "Unity2D",
    platforms: ["PC"],
    tags: ["解謎", "關卡設計", "平台跳躍"],
    poster: "",
    videoFiles: [
      { name: "遊戲展示", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/space-dog.mp4" },
    ],
    overview:
      "玩家扮演拿著飛盤的太空狗狗，核心玩法是丟出兩個飛盤進行物件與物件之間的「換位」。關卡中加入傳送門與引力裝置等機關供玩家解謎，操作簡單易上手。我負責程式設計與關卡設計，並提出更換關卡設計提案促使遊戲有良好的學習曲線與難度設計，最終獲得放式大賞遊戲組競賽第三名。",
    highlights: [
      "實作雙飛盤標記與物件換位（Swap）核心機制",
      "設計傳送門與引力裝置機關，並調整關卡難度曲線與遊戲平衡",
      "優化關卡設計與玩法改良，增加解謎元素提升耐玩度",
    ],
    codeFiles: [],
  },
  {
    id: "vr-card-game",
    title: "VR 抽牌遊戲",
    tagline: "一款讓玩家四選一隨機抽牌的遊戲，目標是抽取加分牌讓金錢越來越高。",
    year: "2024",
    role: "",
    engine: "Unity · VR",
    platforms: ["VR"],
    tags: ["VR", "隨機抽牌", "互動"],
    poster: "",
    videoFiles: [
      { name: "主要展示", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/vr-card.mp4" },
    ],
    overview:
      "一款讓玩家四選一隨機抽牌的遊戲，目標是抽取加分牌讓金錢越來越高。",
    highlights: [
      "以權重亂數控制加分／扣分牌的出現機率，維持刺激度",
      "VR 手把抓取與翻牌動畫、觸覺回饋整合",
      "金錢結算與連續加成規則",
    ],
    codeFiles: [],
  },
  {
    id: "ar-vr-proposal",
    title: "互動式產品介紹（AR / VR）",
    tagline: "AR、VR 互動式產品介紹",
    year: "2024–2026",
    role: "",
    engine: "Unity · AR Foundation",
    platforms: ["Android APK", "VR"],
    tags: ["AR", "VR", "Android"],
    poster: "",
    videoFiles: [
      { name: "AR 展示", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/AR.mp4" },
      { name: "VR 展示", url: "https://pub-86a877e9ebff4295a5208769f38aa96e.r2.dev/VR.mp4" },
    ],
    overview:
      "針對 B2B 提案與客戶需求快速建立的產品介紹原型，包含 AR 互動式產品介紹與 VR 互動式產品介紹，協助商務團隊進行概念驗證（POC）與產品展示。",
    highlights: [
      "AR 平面偵測，點擊畫面即可將產品模型放置於現實空間中",
      "VR 版本提供沉浸式產品導覽",
      "輸出 Android APK 供業務現場使用平板即時展示",
    ],
    codeFiles: [],
  },
];
