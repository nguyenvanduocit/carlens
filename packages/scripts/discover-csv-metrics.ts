#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { CSV_METRICS, generateMetricConstantName, type CsvMetricValue } from '@carlens/shared-types/csv-metrics';

const CSV_DIR = '/path/to/csv/data';

interface FileInfo {
  name: string;
  path: string;
}

interface MetricDiscoveryResult {
  newMetrics: string[];
  existingMetrics: string[];
  totalFiles: number;
  allUniqueMetrics: Set<string>;
}

interface DiscoveryOptions {
  updateTypes?: boolean;
  verbose?: boolean;
}

async function getAllCSVFiles(): Promise<FileInfo[]> {
  try {
    const files = await readdir(CSV_DIR);
    return files
      .filter(file => file.startsWith('CSVLog_') && file.endsWith('.csv'))
      .sort() // Sort to ensure chronological order
      .map(file => ({
        name: file,
        path: join(CSV_DIR, file)
      }));
  } catch (error: any) {
    throw new Error(`Could not read CSV directory: ${error.message}`);
  }
}

async function discoverMetricsFromCSV(filePath: string): Promise<string[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];
    
    // Parse headers from the second line (first line is start time comment)
    const headers = lines[1].split(',').map(h => h.trim());
    return headers;
  } catch (error) {
    console.warn(`⚠️  Could not read ${filePath}: ${(error as Error).message}`);
    return [];
  }
}

async function discoverAllMetrics(options: DiscoveryOptions = {}): Promise<MetricDiscoveryResult> {
  console.log('🔍 Discovering metrics from all CSV files...');
  
  const allFiles = await getAllCSVFiles();
  const allUniqueMetrics = new Set<string>();
  const existingMetrics = Object.values(CSV_METRICS);
  
  let processedFiles = 0;
  
  for (const fileInfo of allFiles) {
    try {
      const headers = await discoverMetricsFromCSV(fileInfo.path);
      headers.forEach(header => allUniqueMetrics.add(header));
      processedFiles++;
      
      if (options.verbose && processedFiles % 10 === 0) {
        console.log(`  📊 Processed ${processedFiles}/${allFiles.length} files...`);
      }
    } catch (error) {
      console.warn(`⚠️  Error processing ${fileInfo.name}: ${(error as Error).message}`);
    }
  }
  
  // Find new metrics that aren't in CSV_METRICS
  const newMetrics = Array.from(allUniqueMetrics).filter(metric => 
    !existingMetrics.includes(metric as CsvMetricValue)
  );
  
  console.log(`📊 Discovery complete: ${allUniqueMetrics.size} unique metrics found`);
  console.log(`  ✅ Known metrics: ${existingMetrics.length}`);
  console.log(`  🆕 New metrics: ${newMetrics.length}`);
  
  if (options.verbose && newMetrics.length > 0) {
    console.log('\n📝 New metrics found:');
    newMetrics.forEach(metric => {
      console.log(`  • ${metric}`);
    });
  }
  
  return {
    newMetrics,
    existingMetrics,
    totalFiles: processedFiles,
    allUniqueMetrics
  };
}

async function updateCSVMetricsFile(discoveryResult: MetricDiscoveryResult): Promise<void> {
  const csvMetricsPath = join(process.cwd(), 'packages', 'shared-types', 'src', 'csv-metrics.ts');
  
  try {
    const content = await readFile(csvMetricsPath, 'utf-8');
    
    // Generate new metric constants
    const newMetricEntries = discoveryResult.newMetrics.map(metric => {
      const constantName = generateMetricConstantName(metric);
      return `  ${constantName}: '${metric}',`;
    });
    
    // Find the CSV_METRICS object and add new entries before the closing brace
    const csvMetricsMatch = content.match(/(export const CSV_METRICS = \{[\s\S]*?)(} as const;)/);
    if (!csvMetricsMatch) {
      throw new Error('Could not find CSV_METRICS object in csv-metrics.ts');
    }
    
    let updatedContent = content;
    
    // Add new metrics to CSV_METRICS if there are any
    if (newMetricEntries.length > 0) {
      const beforeClosing = csvMetricsMatch[1];
      const afterClosing = csvMetricsMatch[2];
      
      // Add new metrics with a comment
      const newMetricsSection = `\n  // Auto-discovered metrics\n${newMetricEntries.join('\n')}\n  `;
      
      updatedContent = updatedContent.replace(
        csvMetricsMatch[0],
        `${beforeClosing}${newMetricsSection}${afterClosing}`
      );
    }
    
    await writeFile(csvMetricsPath, updatedContent, 'utf-8');
    console.log(`✅ Updated ${csvMetricsPath} with ${newMetricEntries.length} new metrics`);
    
  } catch (error) {
    console.error('❌ Failed to update CSV_METRICS:', (error as Error).message);
    throw error;
  }
}

async function generateMetricsReport(discoveryResult: MetricDiscoveryResult): Promise<void> {
  const reportPath = join(process.cwd(), 'csv-metrics-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: discoveryResult.totalFiles,
      totalUniqueMetrics: discoveryResult.allUniqueMetrics.size,
      existingMetrics: discoveryResult.existingMetrics.length,
      newMetrics: discoveryResult.newMetrics.length
    },
    existingMetrics: discoveryResult.existingMetrics.sort(),
    newMetrics: discoveryResult.newMetrics.sort(),
    allMetrics: Array.from(discoveryResult.allUniqueMetrics).sort()
  };
  
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Generated metrics report: ${reportPath}`);
}

// Parse command line arguments
function parseArgs(): DiscoveryOptions & { help?: boolean; report?: boolean } {
  const args = process.argv.slice(2);
  return {
    updateTypes: args.includes('--update-types'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h'),
    report: args.includes('--report')
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  // Show help
  if (options.help) {
    console.log(`
🔍 CSV Metrics Discovery Tool

Usage: bun run discover-csv-metrics.ts [options]

Options:
  --update-types    Update csv-metrics.ts with newly discovered metrics
  --report          Generate JSON report of all metrics
  --verbose, -v     Show detailed progress information
  --help, -h        Show this help message

Examples:
  bun run discover-csv-metrics.ts                      # Discover and list metrics
  bun run discover-csv-metrics.ts --update-types       # Discover and update types file
  bun run discover-csv-metrics.ts --report             # Generate metrics report
  bun run discover-csv-metrics.ts --verbose --report   # Detailed output with report
`);
    process.exit(0);
  }

  try {
    const discoveryResult = await discoverAllMetrics({
      verbose: options.verbose
    });
    
    if (options.updateTypes && discoveryResult.newMetrics.length > 0) {
      console.log('\n📄 Updating CSV metrics file...');
      await updateCSVMetricsFile(discoveryResult);
    } else if (options.updateTypes) {
      console.log('✅ No new metrics found - types file is up to date');
    }
    
    if (options.report) {
      console.log('\n📊 Generating metrics report...');
      await generateMetricsReport(discoveryResult);
    }
    
    if (discoveryResult.newMetrics.length > 0 && !options.updateTypes) {
      console.log('\n💡 Use --update-types to automatically add new metrics to csv-metrics.ts');
    }
    
    console.log('\n✨ Discovery complete!');
    
  } catch (error) {
    console.error('❌ Discovery failed:', (error as Error).message);
    process.exit(1);
  }
}

export { discoverAllMetrics, updateCSVMetricsFile, generateMetricsReport };