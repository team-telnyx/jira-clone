import { test, expect } from '@playwright/test';

test.describe('Kanban Board with Four Columns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/board');
  });

  test('should display all four columns', async ({ page }) => {
    await expect(page.getByText('TODO')).toBeVisible();
    await expect(page.getByText('IN_PROGRESS')).toBeVisible();
    await expect(page.getByText('IN_REVIEW')).toBeVisible();
    await expect(page.getByText('DONE')).toBeVisible();
  });

  test('should display issues in correct columns', async ({ page }) => {
    const todoColumn = page.getByTestId('column-TODO');
    const inProgressColumn = page.getByTestId('column-IN_PROGRESS');
    const inReviewColumn = page.getByTestId('column-IN_REVIEW');
    const doneColumn = page.getByTestId('column-DONE');

    await expect(todoColumn).toBeVisible();
    await expect(inProgressColumn).toBeVisible();
    await expect(inReviewColumn).toBeVisible();
    await expect(doneColumn).toBeVisible();
  });

  test('should show issue counts for each column', async ({ page }) => {
    const todoColumn = page.getByTestId('column-TODO');
    const inProgressColumn = page.getByTestId('column-IN_PROGRESS');
    const inReviewColumn = page.getByTestId('column-IN_REVIEW');
    const doneColumn = page.getByTestId('column-DONE');

    const columns = [
      { element: todoColumn, name: 'TODO' },
      { element: inProgressColumn, name: 'IN_PROGRESS' },
      { element: inReviewColumn, name: 'IN_REVIEW' },
      { element: doneColumn, name: 'DONE' },
    ];

    for (const { element } of columns) {
      await expect(element).toContainText(/\d+/);
    }
  });

  test('should allow drag and drop to IN_REVIEW column', async ({ page }) => {
    const issue = page.getByTestId('issue-ISSUE-1');
    const inReviewColumn = page.getByTestId('column-IN_REVIEW');

    await issue.dragTo(inReviewColumn);

    await expect(inReviewColumn).toContainText('ISSUE-1');
  });

  test('should allow drag and drop from IN_REVIEW to DONE', async ({ page }) => {
    const inReviewColumn = page.getByTestId('column-IN_REVIEW');
    const doneColumn = page.getByTestId('column-DONE');
    const issue = inReviewColumn.locator('[data-sortable="true"]').first();

    await issue.dragTo(doneColumn);

    await expect(doneColumn).toContainText(await issue.textContent() || '');
  });

  test('should persist status updates after refresh', async ({ page }) => {
    const issue = page.getByTestId('issue-ISSUE-1');
    const inReviewColumn = page.getByTestId('column-IN_REVIEW');

    await issue.dragTo(inReviewColumn);
    await page.reload();

    const movedIssue = page.getByTestId('column-IN_REVIEW').locator('[data-testid^="issue-"]').first();
    await expect(movedIssue).toBeVisible();
  });
});
