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
    title: "多人連線專案",
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
        name: "NetworkBrush.cs",
        summary: "多人連線畫筆：本地繪製並批次同步筆畫點",
        code: `using System.Collections.Generic;
using UnityEngine;

public class NetworkBrush : MonoBehaviour
{
    [SerializeField] private LineRenderer linePrefab;
    [SerializeField] private float minPointDistance = 0.01f;
    [SerializeField] private int batchSize = 16;

    private LineRenderer _current;
    private readonly List<Vector3> _points = new();
    private readonly List<Vector3> _pending = new();

    public void BeginStroke(Color color, float width)
    {
        _current = Instantiate(linePrefab);
        _current.startColor = _current.endColor = color;
        _current.startWidth = _current.endWidth = width;
        _points.Clear();
        _pending.Clear();
    }

    public void AddPoint(Vector3 worldPos)
    {
        if (_current == null) return;
        if (_points.Count > 0 &&
            Vector3.Distance(_points[^1], worldPos) < minPointDistance) return;

        _points.Add(worldPos);
        _pending.Add(worldPos);
        _current.positionCount = _points.Count;
        _current.SetPosition(_points.Count - 1, worldPos);

        // 累積到一定數量才送出，降低封包次數
        if (_pending.Count >= batchSize) FlushPending();
    }

    public void EndStroke()
    {
        FlushPending();
        NetworkSender.SendStrokeEnd();
        _current = null;
    }

    private void FlushPending()
    {
        if (_pending.Count == 0) return;
        NetworkSender.SendStrokePoints(_pending.ToArray());
        _pending.Clear();
    }
}`,
      },
      {
        name: "PlayerRoomService.cs",
        summary: "個人房間：房間資料存讀與物件擺放還原",
        code: `using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class RoomItemData
{
    public string itemId;
    public Vector3 position;
    public Vector3 eulerAngles;
}

public class PlayerRoomService : MonoBehaviour
{
    [SerializeField] private Transform roomRoot;
    private readonly Dictionary<string, GameObject> _catalog = new();

    public void LoadRoom(List<RoomItemData> items)
    {
        foreach (Transform child in roomRoot) Destroy(child.gameObject);

        foreach (var data in items)
        {
            if (!_catalog.TryGetValue(data.itemId, out var prefab)) continue;
            var go = Instantiate(prefab, roomRoot);
            go.transform.SetLocalPositionAndRotation(
                data.position, Quaternion.Euler(data.eulerAngles));
        }
    }

    public List<RoomItemData> CaptureRoom()
    {
        var result = new List<RoomItemData>();
        foreach (Transform child in roomRoot)
        {
            var item = child.GetComponent<RoomItem>();
            if (item == null) continue;
            result.Add(new RoomItemData
            {
                itemId = item.ItemId,
                position = child.localPosition,
                eulerAngles = child.localEulerAngles,
            });
        }
        return result;
    }
}`,
      },
      {
        name: "PetShopController.cs",
        summary: "寵物商店：購買驗證、貨幣扣款與寵物切換",
        code: `using System;
using UnityEngine;

public class PetShopController : MonoBehaviour
{
    [SerializeField] private PetDatabase database;
    [SerializeField] private PetSpawner spawner;

    public event Action<string> OnPurchaseFailed;
    public event Action<PetData> OnPetEquipped;

    public void TryBuy(string petId, PlayerWallet wallet, PlayerInventory inventory)
    {
        var pet = database.Find(petId);
        if (pet == null) { OnPurchaseFailed?.Invoke("找不到此寵物"); return; }
        if (inventory.Has(petId)) { OnPurchaseFailed?.Invoke("已擁有此寵物"); return; }
        if (!wallet.TrySpend(pet.price)) { OnPurchaseFailed?.Invoke("金幣不足"); return; }

        inventory.Add(petId);
        Equip(petId, inventory);
    }

    public void Equip(string petId, PlayerInventory inventory)
    {
        if (!inventory.Has(petId)) return;
        var pet = database.Find(petId);
        spawner.Spawn(pet);
        OnPetEquipped?.Invoke(pet);
    }
}`,
      },
    ],
  },
  {
    id: "webgl-games",
    title: "WebGL 網頁遊戲整合平台",
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
        if (!config.IsReady)
        {
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
        while (!op.isDone)
        {
            loading.SetProgress(op.progress);
            yield return null;
        }
        loading.Hide();
    }
}`,
      },
      {
        name: "RemoteConfigService.cs",
        summary: "後台 API 串接：抓取網頁端的遊戲設定",
        code: `using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class GameConfigDto
{
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

        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"[Config] {req.error}");
            IsReady = false;
            yield break;
        }

        _dto = JsonUtility.FromJson<GameConfigDto>(req.downloadHandler.text);
        IsReady = _dto != null;
    }
}`,
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
}`,
      },
    ],
  },
  {
    id: "udp-video-player",
    title: "UDP 影片播放器控制工具",
    tagline: "展場多螢幕影片同步控制，外部硬體/軟體即時操作",
    year: "\n",
    role: "Unity 工程師（展場專案）",
    engine: "Unity · UDP Socket",
    platforms: ["Windows", "展場裝置"],
    tags: ["UDP", "多螢幕", "\n", "\n"],
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

    public event Action<string> OnCommand;

    private UdpClient _client;
    private Thread _thread;
    private volatile bool _running;
    private readonly ConcurrentQueue<string> _queue = new();

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
        while (_running)
        {
            try
            {
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
}`,
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

        switch (parts[1].ToUpperInvariant())
        {
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
}`,
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

        if (body != null)
        {
            body.isKinematic = false;
            body.linearVelocity = Vector3.zero;
        }
    }
}`,
      },
      {
        name: "GravityDevice.cs",
        summary: "引力裝置：範圍內物件受吸引力並可反轉重力",
        code: `using UnityEngine;

[RequireComponent(typeof(SphereCollider))]
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

        var dir = offset.normalized * (repel ? -1f : 1f);
        body.AddForce(dir * strength, ForceMode.Acceleration);
    }

    public void Toggle() => repel = !repel;
}`,
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
}`,
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
public class CardOutcome
{
    public string label;
    public int money;      // 正數加分、負數扣分
    public float weight = 1f;
}

public class CardDrawManager : MonoBehaviour
{
    [SerializeField] private List<CardOutcome> pool = new();
    [SerializeField] private CardView[] cards = new CardView[4];

    public int Money { get; private set; }

    public void Deal()
    {
        foreach (var card in cards)
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
        foreach (var o in pool) total += o.weight;

        var pick = Random.Range(0f, total);
        foreach (var o in pool)
        {
            pick -= o.weight;
            if (pick <= 0f) return o;
        }
        return pool[^1];
    }
}`,
      },
    ],
  },
  {
    id: "ar-vr-proposal",
    title: "互動式產品提案（AR / VR）",
    tagline: "B2B 商務提案用的 AR、VR 產品介紹原型",
    year: "2024–2026",
    role: "Unity 工程師（原型開發）",
    engine: "Unity · AR Foundation",
    platforms: ["Android APK", "VR"],
    tags: ["AR", "VR", "\n", "Android"],
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

[RequireComponent(typeof(ARRaycastManager))]
public class ARProductPlacer : MonoBehaviour
{
    [SerializeField] private GameObject productPrefab;

    private ARRaycastManager _raycaster;
    private readonly List<ARRaycastHit> _hits = new();
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
}`,
      },
      {
        name: "ProductHotspot.cs",
        summary: "資料驅動熱點：點擊顯示零件說明",
        code: `using UnityEngine;

[System.Serializable]
public class HotspotData
{
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
        foreach (var data in config.hotspots)
        {
            var marker = Instantiate(markerPrefab, anchorRoot);
            marker.transform.localPosition = data.localPosition;
            marker.Bind(data, Show);
        }
    }

    private void Show(HotspotData data) => panel.Show(data.title, data.description);
}`,
      },
    ],
  },
];
