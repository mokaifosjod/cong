import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BlogArticle } from "@shared/schema";

type BlogViewParams = {
  articleId?: string;
};

export default function BlogView() {
  const params = useParams<BlogViewParams>();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: blogData, isLoading } = useQuery<{ articles: BlogArticle[]; total: number }>({
    queryKey: ["/api/blog/articles"],
  });

  const { data: articleData, isLoading: isLoadingArticle } = useQuery<BlogArticle>({
    queryKey: ["/api/blog/article", params.articleId],
    queryFn: async () => {
      const response = await fetch(`/api/blog/article/${params.articleId}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      return response.json();
    },
    enabled: !!params.articleId
  });

  const articles = blogData?.articles || [];
  const filteredArticles = selectedCategory === "all" 
    ? articles 
    : articles.filter(article => article.category.toLowerCase() === selectedCategory);

  const featuredArticle = articles.find(article => article.featured);
  const categories = [
    { id: "all", name: "All Articles" },
    { id: "jee", name: "JEE Preparation" },
    { id: "neet", name: "NEET Preparation" },
    { id: "upsc", name: "UPSC Preparation" },
    { id: "tips", name: "Study Tips" }
  ];

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "jee preparation": return "blue";
      case "neet preparation": return "green";
      case "upsc preparation": return "purple";
      case "study tips": return "amber";
      default: return "gray";
    }
  };

  if (params.articleId) {
    // Individual Article View
    if (isLoadingArticle) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      );
    }

    if (!articleData) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h2>
              <p className="text-gray-600 mb-6">The article you're looking for doesn't exist.</p>
              <Button onClick={() => setLocation("/blog")}>
                Back to Blog
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/blog")}
          className="text-gray-600 hover:text-gray-800 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Blog
        </Button>

        <article>
          <Card>
            <CardContent className="p-8">
              <div className="mb-6">
                <Badge variant="secondary" className={`bg-${getCategoryColor(articleData.category)}-100 text-${getCategoryColor(articleData.category)}-800`}>
                  {articleData.category}
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                {articleData.title}
              </h1>
              
              <div className="flex items-center text-gray-600 mb-8 space-x-4">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {articleData.author}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {articleData.readTime}
                </div>
                <span>{articleData.date}</span>
              </div>

              <img 
                src={articleData.imageUrl} 
                alt={articleData.title}
                className="w-full h-64 object-cover rounded-lg mb-8"
              />

              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: articleData.content }}
              />

              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {articleData.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">{articleData.author}</div>
                    <div className="text-gray-600">Education Expert & Content Creator</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    );
  }

  // Blog List View
  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-64 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Study Resources & Tips</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert insights, study strategies, and comprehensive guides to help you excel in competitive exams
          </p>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <div className="mb-12">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-0">
              <CardContent className="p-8">
                <Badge variant="secondary" className="bg-white/20 text-white mb-4">
                  Featured
                </Badge>
                <h3 className="text-3xl font-bold mb-4">{featuredArticle.title}</h3>
                <p className="text-xl text-blue-100 mb-6">{featuredArticle.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-blue-100">
                    <span>{featuredArticle.author}</span>
                    <span>•</span>
                    <span>{featuredArticle.readTime}</span>
                    <span>•</span>
                    <span>{featuredArticle.date}</span>
                  </div>
                  <Button 
                    variant="secondary"
                    onClick={() => setLocation(`/blog/${featuredArticle.id}`)}
                  >
                    Read Article
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="rounded-full"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <Card 
              key={article.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation(`/blog/${article.id}`)}
            >
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge 
                    variant="secondary" 
                    className={`bg-${getCategoryColor(article.category)}-100 text-${getCategoryColor(article.category)}-800`}
                  >
                    {article.category}
                  </Badge>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {article.readTime}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {article.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <span>{article.author}</span>
                  <span className="mx-2">•</span>
                  <span>{article.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
          >
            Load More Articles
          </Button>
        </div>
      </div>
    </div>
  );
}
