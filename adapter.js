/* static-movie-wall adapter
 * Replaces the Flask backend (/api/*) with bundled local JSON data so the
 * page works as a pure static site on GitHub Pages.
 */
(function () {
  "use strict";

  function loadJSON(u) {
    return fetch(u, { method: "GET" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " " + u);
      return r.json();
    });
  }

  var readyError = null;
  var ready = Promise.all([
    loadJSON("data/movies.json"),
    loadJSON("data/poster_names.json")
  ]).then(function (res) {
    var movies = res[0] || [];
    var names = res[1] || [];
    var byId = new Map();
    movies.forEach(function (m) { byId.set(m.id, m); });
    window.MW = {
      movies: movies,
      byId: byId,
      posters: new Set(names),
      creditsCache: new Map(),
      ready: true
    };
    return window.MW;
  }).catch(function (e) {
    readyError = e;
    window.MW = { movies: [], byId: new Map(), posters: new Set(), creditsCache: new Map(), ready: true };
    console.error("[static] 数据加载失败：", e);
  });

  function requireMW() {
    if (readyError) throw new Error("静态数据加载失败：" + (readyError.message || readyError));
    return ready;
  }

  /* ------- /api/filter, /api/movies, /api/search 本地查询引擎 ------- */
  function localQuery(MW, url) {
    var qmark = String(url).indexOf("?");
    var params = new URLSearchParams(qmark >= 0 ? String(url).slice(qmark + 1) : "");
    var q = (params.get("q") || "").trim().toLowerCase();
    var minYear = Number(params.get("min_year")) || null;
    var maxYear = Number(params.get("max_year")) || null;
    var minRating = Number(params.get("min_rating")) || null;
    var genre = (params.get("genre") || "").trim();
    var page = Math.max(1, Number(params.get("page")) || 1);
    var pageSize = Math.max(1, Number(params.get("page_size")) || 24);

    var all = MW.movies;
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var m = all[i];
      if (q) {
        var hay = ((m.title || "") + " " + (m.director || "")).toLowerCase();
        if (hay.indexOf(q) < 0) continue;
      }
      if (genre) {
        var ids = String(m.genre_ids == null ? "" : m.genre_ids);
        var parts = ids.split(",").map(function (s) { return s.trim(); });
        if (parts.indexOf(genre) < 0) continue;
      }
      if (minYear || maxYear) {
        var y = Number(m.year);
        if (!(y > 0)) continue;
        if (minYear && y < minYear) continue;
        if (maxYear && y > maxYear) continue;
      }
      if (minRating) {
        var r = Number(m.rating);
        if (!(r > 0) || r < minRating) continue;
      }
      out.push(m);
    }
    var total = out.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) page = totalPages;
    var slice = out.slice((page - 1) * pageSize, page * pageSize);
    return {
      code: 0, message: "ok",
      total: total, page: page, page_size: pageSize, total_pages: totalPages,
      data: slice
    };
  }

  window.fetchJson = async function (url) {
    var MW = await requireMW();
    var res = localQuery(MW, url);
    return { json: res, list: res.data };   // 与原后端 fetchJson 的返回结构保持一致
  };

  /* ------- 详情/演员：全部来自本地 JSON，不再访问 TMDB ------- */
  window.tmdbFetch = async function (path) {
    await requireMW();
    return null;              // 本地已含标题/年份/评分/简介/类型，无需在线补充
  };

  window.fetchLocalCredits = async function (id) {
    var MW = await requireMW();
    var cache = MW.creditsCache;
    if (cache.has(id)) return cache.get(id);
    try {
      var resp = await fetch("data/credits/" + encodeURIComponent(id) + ".json");
      if (!resp.ok) { cache.set(id, null); return null; }
      var json = await resp.json();
      var val = (json && Array.isArray(json.cast)) ? json : null;
      cache.set(id, val);
      return val;
    } catch (e) {
      cache.set(id, null);
      return null;
    }
  };

  /* ------- 图片：优先本地 posters/，演员头像无本地图时直接首字母兜底 ------- */
  window.buildTmdbImageCandidates = function (path, size) {
    try {
      var MW = window.MW;
      if (!MW) return [];
      var s = String(path || "").trim();
      if (!s) return [];
      if (s.indexOf("posters/") === 0) return [s];
      if (/^https?:/.test(s)) return [s];
      var name = s.split("/").pop().split("?")[0];
      if (name && MW.posters.has(name)) return ["posters/" + name];
      return [];
    } catch (e) {
      return [];
    }
  };
})();
