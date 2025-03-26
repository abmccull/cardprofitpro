import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { searchPSADatabase, getPopulationReport } from '@/lib/psa/client';
import { createClient } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get card details to ensure ownership and get search query
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', params.cardId)
      .eq('owner_id', session.user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Card not found or unauthorized' },
        { status: 404 }
      );
    }

    // Build search query
    const searchQuery = [
      card.name,
      card.year,
      card.manufacturer,
    ].filter(Boolean).join(' ');

    // Search PSA database
    const searchResults = await searchPSADatabase(searchQuery);

    // Get population reports for each result
    const populationReports = await Promise.all(
      searchResults.map(async (result) => {
        const report = await getPopulationReport(result.certNumber);
        return {
          ...result,
          population_data: report,
        };
      })
    );

    // Calculate grading insights
    const grades = populationReports.map(report => ({
      grade: report.grade,
      population: report.population || 0,
      higher_population: report.higherPopulation || 0,
    }));

    const gradingInsights = grades.length > 0 ? {
      total_graded: grades.reduce((sum, g) => sum + g.population, 0),
      grade_distribution: grades.reduce((acc, g) => {
        acc[g.grade] = g.population;
        return acc;
      }, {} as Record<string, number>),
      rarity_score: calculateRarityScore(grades),
    } : null;

    return NextResponse.json({
      data: {
        search_results: searchResults,
        population_reports: populationReports,
        grading_insights: gradingInsights,
      },
    });
  } catch (error) {
    console.error('Error in grading data route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateRarityScore(grades: { grade: string; population: number; higher_population: number }[]): number {
  if (grades.length === 0) return 0;

  // Find the highest grade
  const highestGrade = Math.max(...grades.map(g => parseFloat(g.grade)));
  const highestGradeData = grades.find(g => parseFloat(g.grade) === highestGrade);

  if (!highestGradeData) return 0;

  // Calculate rarity score based on population and higher grades
  const totalPopulation = grades.reduce((sum, g) => sum + g.population, 0);
  const higherGradePopulation = highestGradeData.higher_population;

  // Score is inversely proportional to the percentage of cards at or above this grade
  const rarityPercentage = 1 - ((highestGradeData.population + higherGradePopulation) / totalPopulation);
  
  // Convert to a 1-100 scale and round to 2 decimal places
  return Math.round(rarityPercentage * 100 * 100) / 100;
} 