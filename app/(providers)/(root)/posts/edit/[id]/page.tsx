"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";
import Header from "@/components/Header";

const PostEdit = ({ params }: { params: { id: string } }) => {
  const postId = params.id; // postId는 params.id에서 직접 할당
  const [boardId, setBoardId] = useState<string>("");
  const [movieName, setMovieName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 게시글 데이터를 가져오는 useEffect
  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setBoardId(data.board_id);
        setMovieName(data.movie_name);
        setContent(data.content);
      }
    };

    fetchPost();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;

      // 파일이 있다면 Supabase 스토리지에 업로드
      if (file) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        let path: string | undefined;
        if (isImage) {
          path = `images/${Date.now()}_${file.name}`;
        } else if (isVideo) {
          path = `videos/${Date.now()}_${file.name}`;
        }

        if (path) {
          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("media").upload(path, file);

          if (uploadError) throw uploadError;

          const publicUrl = supabase.storage
            .from("media")
            .getPublicUrl(uploadData.path).data.publicUrl;

          if (isImage) {
            imageUrl = publicUrl;
          } else if (isVideo) {
            videoUrl = publicUrl;
          }
        }
      }

      // 게시글 업데이트
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          board_id: boardId,
          movie_name: movieName,
          content: content,
          image_url: imageUrl,
          video_url: videoUrl,
        })
        .eq("id", postId);

      if (updateError) throw updateError;

      // 성공 시 메인 페이지로 이동
      router.push("/posts");
    } catch (err) {
      const error = err as Error; // err를 Error 타입으로 단언
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black">
      <Header />
      <div className="container mx-auto p-8 bg-white rounded-lg shadow-lg mt-8 max-w-2xl">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
          게시글 수정
        </h1>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              게시판 제목
            </label>
            <input
              type="text"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              placeholder="게시판 제목을 입력하세요"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              영화 이름
            </label>
            <input
              type="text"
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              placeholder="영화 이름을 입력하세요"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              rows={4}
              placeholder="내용을 입력하세요"
              required
            ></textarea>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              파일 업로드
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="p-3 border border-gray-300 rounded-lg w-full cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
            />
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              type="submit"
              className={`px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "게시글 수정 중..." : "게시글 수정"}
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-300"
              onClick={() => router.back()} // 취소 버튼 클릭 시 이전 페이지로 이동
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEdit;
