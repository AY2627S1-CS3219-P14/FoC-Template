import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/useAuth'
import { NotificationProvider } from './NotificationProvider'
import { NotificationBell } from './NotificationBell'
import {
  getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead, openNotificationStream,
} from './notification.api'
import { useNotifications } from './useNotifications'
import type { NotificationItem } from './notification.types'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('./notification.api', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  openNotificationStream: vi.fn(),
  notificationHistoryLimit: 20,
}))

const alice = {
  status: 'authenticated' as const,
  currentUserId: 'alice',
  signIn: vi.fn(),
  signOut: vi.fn(),
}

const item: NotificationItem = {
  id: 'first',
  type: 'ERRAND_DELIVERED',
  errandId: 'errand',
  message: 'Delivered',
  createdAt: '2026-11-08T00:00:00Z',
  readAt: null,
}

function Feed() {
  const feed = useNotifications()
  return (
    <>
      <output aria-label="unread">{feed?.unreadCount}</output>
      <ul>{feed?.items.map((notification) => <li key={notification.id}>{notification.message}</li>)}</ul>
    </>
  )
}

afterEach(() => vi.resetAllMocks())

describe('NotificationProvider', () => {
  it('merges history and live alerts by ID, and loads missed alerts on reconnect', async () => {
    vi.mocked(useAuth).mockReturnValue(alice)
    vi.mocked(openNotificationStream).mockImplementation(() => new Promise(() => {}))
    vi.mocked(getNotifications).mockResolvedValue([])
    vi.mocked(getUnreadCount).mockResolvedValue(0)
    render(<NotificationProvider><Feed /></NotificationProvider>)
    await waitFor(() => expect(openNotificationStream).toHaveBeenCalledOnce())
    const stream = vi.mocked(openNotificationStream).mock.calls[0][0]

    vi.mocked(getNotifications).mockResolvedValue([item])
    vi.mocked(getUnreadCount).mockResolvedValue(1)
    act(() => {
      stream.onConnected()
      stream.onNotification(item)
    })
    await waitFor(() => expect(screen.getByLabelText('unread')).toHaveTextContent('1'))
    expect(screen.getAllByText('Delivered')).toHaveLength(1)

    vi.mocked(getNotifications).mockResolvedValue([
      item,
      { ...item, id: 'missed', message: 'Missed while offline' },
    ])
    act(() => {
      stream.onReconnect()
      stream.onConnected()
    })
    expect(await screen.findByText('Missed while offline')).toBeInTheDocument()
    expect(openNotificationStream).toHaveBeenCalledOnce()
  })

  it('aborts requests on logout and drops data from the previous account', async () => {
    vi.mocked(useAuth).mockReturnValue(alice)
    vi.mocked(openNotificationStream).mockImplementation(() => new Promise(() => {}))
    vi.mocked(getNotifications).mockResolvedValue([item])
    vi.mocked(getUnreadCount).mockResolvedValue(1)
    const { rerender } = render(<NotificationProvider><Feed /></NotificationProvider>)
    expect(await screen.findByText('Delivered')).toBeInTheDocument()
    const previous = vi.mocked(openNotificationStream).mock.calls[0][0]
    const historySignal = vi.mocked(getNotifications).mock.calls[0][0]

    vi.mocked(useAuth).mockReturnValue({ ...alice, status: 'unauthenticated', currentUserId: null })
    rerender(<NotificationProvider><Feed /></NotificationProvider>)
    expect(previous.signal.aborted).toBe(true)
    expect(historySignal.aborted).toBe(true)
    expect(screen.queryByText('Delivered')).not.toBeInTheDocument()

    vi.mocked(useAuth).mockReturnValue({ ...alice, currentUserId: 'bob' })
    vi.mocked(getNotifications).mockResolvedValue([])
    vi.mocked(getUnreadCount).mockResolvedValue(0)
    rerender(<NotificationProvider><Feed /></NotificationProvider>)
    act(() => previous.onNotification(item))
    await waitFor(() => expect(screen.getByLabelText('unread')).toHaveTextContent('0'))
    expect(screen.queryByText('Delivered')).not.toBeInTheDocument()
  })

  it('marks an alert or the whole feed as read and reloads the server unread count', async () => {
    vi.mocked(useAuth).mockReturnValue(alice)
    vi.mocked(openNotificationStream).mockImplementation(() => new Promise(() => {}))
    let items = [item, { ...item, id: 'other', message: 'Another alert' }]
    vi.mocked(getNotifications).mockImplementation(async () => items)
    vi.mocked(getUnreadCount).mockImplementation(async () => items.filter((alert) => !alert.readAt).length)
    vi.mocked(markNotificationRead).mockImplementation(async (id) => {
      items = items.map((alert) => alert.id === id ? { ...alert, readAt: alert.createdAt } : alert)
    })
    vi.mocked(markAllNotificationsRead).mockImplementation(async () => {
      items = items.map((alert) => ({ ...alert, readAt: alert.createdAt }))
    })
    render(<MemoryRouter><NotificationProvider><NotificationBell /></NotificationProvider></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: 'Notifications (2 unread)' }))
    expect(screen.getByRole('link', { name: 'Delivered' })).toHaveAttribute('href', '/errands/errand')
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark as read' })[0])
    expect(await screen.findByRole('button', { name: 'Notifications (1 unread)' })).toBeInTheDocument()
    expect(markNotificationRead).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(await screen.findByRole('button', { name: 'Notifications' })).toBeInTheDocument()
    expect(markAllNotificationsRead).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Mark as read' })).not.toBeInTheDocument()
  })
})
