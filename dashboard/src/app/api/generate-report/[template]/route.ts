import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

import { APP_URL } from '../../../../../config/app';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ template: string }> },
  //res: NextApiResponse
) {
  // extract template arg.
  const templateName = (await params).template;
  // extract the batch uuids, col/filter/sort options.
  const searchParams = req.nextUrl.searchParams;
  const batchUuids = searchParams.get('b');
  const cols = searchParams.get('c');
  const filter = searchParams.get('f');
  const sort = searchParams.get('s');

  const batchQuery = batchUuids ? `b=${batchUuids}` : '';
  const colQuery = cols ? `c=${cols}` : '';
  const filterQuery = filter ? `f=${filter}` : '';
  const sortQuery = sort ? `s=${sort}` : '';
  const query = `?${[batchQuery, colQuery, filterQuery, sortQuery].filter((q) => q !== '').join('&')}`;

  // launch headless browser.
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    waitForInitialPage: false,
    // executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' // may vary per env
  });

  // open new tab and visit template page.
  const page = await browser.newPage();
  await page.goto(`${APP_URL}/${templateName}${query}`, {
    waitUntil: 'networkidle0',
  });

  // take pdf snapshot.
  const pdf = await page.pdf({ format: 'A4', margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' } });
  await browser.close();

  // send pdf back to client.
  const response = new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=las-report.pdf',
    },
  });

  return response;
}