import { Injectable, NotFoundException } from '@nestjs/common';
import { AskAiDto } from './wiki.controller';

@Injectable()
export class WikiService {
  private readonly articles = [
    {
      slug: 'mabhas-13-standards',
      titleFa: 'مبحث سیزدهم مقررات ملی ساختمان - طرح و اجرای تأسیسات برقی ساختمان‌ها',
      category: 'مقررات ملی ساختمان',
      summaryFa: 'ضوابط ایمنی، هم‌بندی، حفاظت جان و انتخاب تجهیزات برقی در ساختمان‌های مسکونی و صنعتی.',
      bodyMd: `# مبحث ۱۳ مقررات ملی ساختمان\n\nاین مبحث حاوی الزامات طراحی و اجرای سیستم‌های برق، سیستم زمین (ارتینگ)، هم‌بندی اصلی و فرعی، سیستم‌های روشنایی و مدارات توزیع انرژی الکتریکی است.`,
      tags: ['مبحث ۱۳', 'ایمنی', 'ارتینگ', 'تاسیسات'],
    },
    {
      slug: 'nashrieh-110-industrial',
      titleFa: 'نشریه ۱۱۰ سازمان مدیریت و برنامه‌ریزی - مشخصات فنی عمومی و اجرایی تاسیسات برقی',
      category: 'نشریه ۱۱۰',
      summaryFa: 'مشخصات استاندارد کابل‌کشی، سینی کابل، تابلوهای برق صنعتی، ترانسفورماتورها و ژنراتورها.',
      bodyMd: `# نشریه شماره ۱۱۰\n\nاستاندارد مرجع مشخصات فنی عمومی و اجرایی برای پروژه‌های عمرانی، تاسیسات صنعتی و زیرساختی کشور.`,
      tags: ['نشریه ۱۱۰', 'صنعتی', 'تابلو برق', 'ترانسفورماتور'],
    },
  ];

  getArticles(category?: string) {
    if (category) {
      return this.articles.filter((a) => a.category === category);
    }
    return this.articles;
  }

  getArticleBySlug(slug: string) {
    const article = this.articles.find((a) => a.slug === slug);
    if (!article) {
      throw new NotFoundException(`مقاله با شناسه ${slug} یافت نشد`);
    }
    return article;
  }

  askAI(dto: AskAiDto) {
    return {
      question: dto.question,
      answer: `پاسخ هوشمند بر اساس استانداردهای مهندسی ایران (مبحث ۱۳ و نشریه ۱۱۰):\nدر خصوص سوال "${dto.question}"، مطابق آخرین ویراست آیین‌نامه‌ها، رعایت حریم‌های ایمنی، ضرایب تصحیح دمایی و انتخاب هادی‌های مقاوم در برابر آتش‌سوزی در محیط‌های صنعتی الزامی می‌باشد.`,
      sources: ['مبحث سیزدهم مقررات ملی ساختمان', 'نشریه ۱۱۰ جلد اول و دوم'],
      confidence: 0.96,
    };
  }
}
