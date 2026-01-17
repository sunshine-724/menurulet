"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";

//csv読み込み型
interface Recipe{
  //識別用
  id: string;

  //料理名
  //実際に表示される料理名
  name: string; 
  
  //材料タイプ
  //ドロップダウンボタンから選択されるカテゴリ
  category: string; 

  // 時間タイプ
  // ここには朝:M,昼:L,夜:Dといったアルファベット１つが３つのうち一つ入る
  meal_type: string; 
}

interface Category {
  //材料のタイプを示す
  //public/cat.csvの要素が入る
  name: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // 選択されたカテゴリ
  const [recipes, setRecipes] = useState<Recipe[]>([]); // 全データ用
  const [result, setResult] = useState<string>("");    // 抽選結果用

  // CSV読み込み
  useEffect(() => {
    // カテゴリの読み込み
    fetch("/cat.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = Papa.parse<Category>(csv, { header: true });
        setCategories(parsed.data);
        // 初期値を最初の項目に設定しておくと親切
        if (parsed.data.length > 0) {
          setSelectedCategory((parsed.data[0] as Category).name);
        }
      });
    //メニューの読み込み
    fetch("/menu_list.csv")
      .then((response) => response.text())
      .then((csvData) => {
        const parsed = Papa.parse(csvData, { header: true });
        const recipes = parsed.data as Recipe[];
        //ステートに保存
        setRecipes(recipes)
      });
  }, []);

  //現在の時刻タイプを確認する
  //時間によって"M"または"L"または"D"が返ってくる
  const getMealTypeByTime = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
      return "M"; // 5:00 - 10:59 は朝食
    } else if (hour >= 11 && hour < 16) {
      return "L"; // 11:00 - 15:59 は昼食
    } else {
      return "D"; // それ以外（16:00 - 4:59）は夕食
    }
  };

  //抽選
  //抽選ボタンが押された時に発動する
  //抽選した結果のメニューのテキストが返ってくる
  const randomizeMenu = () =>{
    if (!selectedCategory) {
      alert("カテゴリを選択してください");
      return;
    }
    // 現在の時間からターゲットとなる meal_type を決定
    const targetType = getMealTypeByTime();

    // 絞り込み：カテゴリが一致 ＋ 時間帯(meal_type)が一致
    let filtered = recipes.filter((rData: Recipe)=> rData.category === selectedCategory && rData.meal_type == targetType);
    if(filtered.length < 1){
        //フォールバック
        filtered = recipes.filter((rData: Recipe)=> rData.category === selectedCategory);   
    }

    if(filtered.length > 0){
      const randomIndex = Math.floor(Math.random() * filtered.length);
      const selected = filtered[randomIndex];
      
      // 画面に反映
      setResult(selected.name);
      console.log("抽選結果:", selected.name);
    } else {
      alert("該当するメニューがありません");
    }
  }
  // 時間帯に応じて背景とテキストの色を変える
  // 背景色とテキストの色を返す
  const getThemeColorsOfTime = () => {
    const type = getMealTypeByTime();

    switch (type) {
      case "M":
        return "bg-orange-200 text-white"; // 朝：薄いオレンジ、文字は黒
      case "L":
        return "bg-sky-200 text-white";    // 昼：薄い青、文字は黒
      case "D":
        return "bg-slate-900 text-white";   // 夜：濃いグレー、文字は白
      default:
        return "bg-white text-gray-900";
    }
  };
  return (
// getThemeColors() から返ってきたクラス名を適用
    <main className={`min-h-screen transition-colors duration-1000 p-10 ${getThemeColorsOfTime()}`}>
      <div className="max-w-md mx-auto space-y-6">
        {/* コンテンツ部分（夜の場合はカードを少し暗くするなど調整） */}
        <div className={`p-8 rounded-2xl shadow-xl ${getMealTypeByTime() === "D" ? "bg-slate-800" : "bg-white text-gray-900"}`}>
          <h1 className="text-2xl font-bold text-center mb-6">献立抽選アプリ</h1>
          {/* カテゴリ選択プルダウン */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-white-700">カテゴリを選んでください</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded-md bg-gray shadow-sm"
            >
              {categories.map((cat, index) => (
                <option key={index} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 抽選ボタン */}
          <button
            onClick={randomizeMenu}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
          >
            このカテゴリから抽選する
          </button>

          {/* 結果表示 */}
          {result && (
            <div className="mt-6 p-8 border-4 border-double border-green-200 rounded-xl text-center bg-green-50">
              <p className="text-green-700 text-sm font-bold mb-2">⭐️⭐️⭐️ 今回のメニューは!? ⭐️⭐️⭐️</p>
              <h2 className="text-3xl font-extrabold text-gray-800">{result}</h2>
            </div>
          )}
      </div>
    </div>
    </main>
    
  );
}
