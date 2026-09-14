import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import './App.css'

import {
  getAllSurveys,
  saveSurvey,
} from './db'

import {
  syncPendingSurveys,
} from './sync'


const initialForm = {
  interviewer: '',
  major: '',
  year: '',
  jobField: '',
  workType: '',
  salary: '',
  priority: '',
  support: '',
  other: '',
}


function createSessionId() {
  return `SUR-${Date.now().toString().slice(-6)}`
}


async function checkInternetConnection() {
  if (!navigator.onLine) {
    return false
  }

  const controller =
    new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, 3000)

  try {
    await fetch(
      'https://www.gstatic.com/generate_204',
      {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      },
    )

    clearTimeout(timeout)

    return true
  } catch {
    clearTimeout(timeout)

    return false
  }
}


function App() {
  const [page, setPage] =
    useState('home')

  const [surveys, setSurveys] =
    useState([])

  const [isOnline, setIsOnline] =
    useState(navigator.onLine)

  const [form, setForm] =
    useState(initialForm)

  const [photo, setPhoto] =
    useState(null)

  const [photoData, setPhotoData] =
    useState({
      base64: '',
      name: '',
      type: '',
    })

  const [location, setLocation] =
    useState(null)

  const [sessionId, setSessionId] =
    useState('')

  const syncLock =
    useRef(false)


  /* =========================
     LOAD SURVEYS
  ========================= */

  const loadSurveys = async () => {
    try {
      const data =
        await getAllSurveys()

      data.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt),
      )

      setSurveys(data)
    } catch (error) {
      console.error(
        'Load surveys error:',
        error,
      )
    }
  }


  /* =========================
     SYNC
  ========================= */

  const syncData = async () => {
    if (syncLock.current) {
      return
    }

    syncLock.current = true

    try {
      const result =
        await syncPendingSurveys()

      if (result.count > 0) {
        await loadSurveys()

        alert(
          `✓ Đồng bộ thành công ${result.count} khảo sát!`,
        )
      }
    } catch (error) {
      console.error(
        'Sync error:',
        error,
      )
    } finally {
      syncLock.current = false
    }
  }


  /* =========================
     ONLINE / OFFLINE
  ========================= */

  useEffect(() => {
    loadSurveys()

    const checkStatus = async () => {
      const online =
        await checkInternetConnection()

      setIsOnline(online)

      if (online) {
        await syncData()
      }
    }

    checkStatus()

    const handleOnline =
      async () => {
        console.log(
          'NETWORK: ONLINE',
        )

        setIsOnline(true)

        await syncData()
      }

    const handleOffline = () => {
      console.log(
        'NETWORK: OFFLINE',
      )

      setIsOnline(false)
    }

    window.addEventListener(
      'online',
      handleOnline,
    )

    window.addEventListener(
      'offline',
      handleOffline,
    )

    const timer =
      setInterval(() => {
        checkStatus()
      }, 10000)

    return () => {
      window.removeEventListener(
        'online',
        handleOnline,
      )

      window.removeEventListener(
        'offline',
        handleOffline,
      )

      clearInterval(timer)
    }
  }, [])


  /* =========================
     STATISTICS
  ========================= */

  const stats = useMemo(() => {
    const synced =
      surveys.filter(
        (item) =>
          item.status === 'SYNCED',
      ).length

    const pending =
      surveys.filter(
        (item) =>
          item.status === 'PENDING',
      ).length

    return {
      total: surveys.length,
      synced,
      pending,
    }
  }, [surveys])


  /* =========================
     FORM CHANGE
  ========================= */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }


  /* =========================
     START SURVEY
  ========================= */

  const startSurvey = () => {
    setForm(initialForm)

    setPhoto(null)

    setPhotoData({
      base64: '',
      name: '',
      type: '',
    })

    setLocation(null)

    setSessionId(
      createSessionId(),
    )

    setPage('survey')
  }


  /* =========================
     GO HOME
  ========================= */

  const goHome = async () => {
    await loadSurveys()

    setPage('home')
  }


  /* =========================
     GPS
  ========================= */

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert(
        'Thiết bị không hỗ trợ GPS.',
      )

      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,
        })
      },

      () => {
        alert(
          'Không thể lấy vị trí hiện tại.',
        )
      },
    )
  }


  /* =========================
     PHOTO
  ========================= */

  const handlePhoto = (e) => {
    const file =
      e.target.files?.[0]

    if (!file) {
      return
    }

    // Preview
    const previewUrl =
      URL.createObjectURL(file)

    setPhoto(previewUrl)

    // Read file
    const reader =
      new FileReader()

    reader.onload = () => {
      const img =
        new Image()

      img.onload = () => {
        const maxWidth = 1280

        const scale =
          Math.min(
            1,
            maxWidth / img.width,
          )

        const width =
          Math.round(
            img.width * scale,
          )

        const height =
          Math.round(
            img.height * scale,
          )

        const canvas =
          document.createElement(
            'canvas',
          )

        canvas.width = width
        canvas.height = height

        const ctx =
          canvas.getContext('2d')

        if (!ctx) {
          return
        }

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height,
        )

        const compressed =
          canvas.toDataURL(
            'image/jpeg',
            0.7,
          )

        const base64 =
          compressed.split(',')[1]

        setPhotoData({
          base64,
          name: `survey-${Date.now()}.jpg`,
          type: 'image/jpeg',
        })

        console.log(
          'PHOTO READY:',
          {
            width,
            height,
            base64Length:
              base64.length,
          },
        )
      }

      if (
        typeof reader.result ===
        'string'
      ) {
        img.src =
          reader.result
      }
    }

    reader.onerror = () => {
      console.error(
        'Không thể đọc ảnh',
      )
    }

    reader.readAsDataURL(file)
  }


  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!sessionId) {
      alert(
        'Session không hợp lệ. Hãy bắt đầu khảo sát lại.',
      )

      return
    }

    const survey = {
      sessionId,

      createdAt:
        new Date().toISOString(),

      ...form,

      location,

      // Preview trên giao diện
      photo,

      // Ảnh thật gửi lên Drive
      photoBase64:
        photoData.base64,

      photoName:
        photoData.name,

      photoType:
        photoData.type,

      status: 'PENDING',
    }

    console.log(
      'SURVEY BEFORE SAVE:',
      {
        sessionId:
          survey.sessionId,

        photo:
          survey.photo,

        photoBase64:
          survey.photoBase64
            ? 'CÓ'
            : 'KHÔNG',

        photoName:
          survey.photoName,

        photoType:
          survey.photoType,
      },
    )

    try {
      await saveSurvey(
        survey,
      )

      await loadSurveys()

      // Có mạng thì thử đồng bộ ngay
      if (isOnline) {
        await syncData()
      }

      await loadSurveys()

      alert(
        '✓ Khảo sát đã được lưu thành công!',
      )

      setPage('home')
    } catch (error) {
      console.error(
        'Save survey error:',
        error,
      )

      alert(
        'Không thể lưu khảo sát.',
      )
    }
  }


  /* =====================================
     HOME
  ===================================== */

  if (page === 'home') {
    return (
      <div className="app">

        <header className="topbar">

          <div className="topbar-inner">

           <div className="brand">
  <div className="brand-mark">
    <img
      src="/logo-vku.png"
      alt="VKU Job Survey"
    />
  </div>

  <div>
    <h1>Student Job Survey</h1>
    <p>Khảo sát nhu cầu việc làm của sinh viên</p>
  </div>
</div>

            <div
              className={`connection ${
                isOnline
                  ? 'is-online'
                  : 'is-offline'
              }`}
            >
              <span />

              {isOnline
                ? 'Online'
                : 'Offline'}
            </div>

          </div>

        </header>


        <main className="dashboard">

          {/* HERO */}

          <section className="hero-card">

            <div className="hero-content">

              <span className="eyebrow">
                FIELD SURVEY
              </span>

              <h2>
                Khảo sát nhu cầu
                <br />
                việc làm
              </h2>

              <p>
                Thu thập thông tin về nhu cầu,
                mong muốn và định hướng nghề
                nghiệp của sinh viên.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={
                  startSurvey
                }
              >
                <span>
                  ＋
                </span>

                Bắt đầu khảo sát
              </button>

            </div>


            <div className="hero-decoration">

              <div className="floating-card card-a">

                <span>
                  📋
                </span>

                <div>
                  <strong>
                    Khảo sát
                  </strong>

                  <small>
                    Offline ready
                  </small>
                </div>

              </div>


              <div className="floating-card card-b">

                <span>
                  📍
                </span>

                <div>
                  <strong>
                    GPS
                  </strong>

                  <small>
                    Field location
                  </small>
                </div>

              </div>


              <div className="hero-circle" />

            </div>

          </section>


          {/* STATS */}

          <section className="stat-grid">

            <div className="stat-card">

              <div className="stat-symbol purple">
                ▣
              </div>

              <div>

                <strong>
                  {stats.total}
                </strong>

                <span>
                  Tổng khảo sát
                </span>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-symbol green">
                ✓
              </div>

              <div>

                <strong>
                  {stats.synced}
                </strong>

                <span>
                  Đã đồng bộ
                </span>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-symbol orange">
                ↑
              </div>

              <div>

                <strong>
                  {stats.pending}
                </strong>

                <span>
                  Chờ đồng bộ
                </span>

              </div>

            </div>

          </section>


          {/* RECENT */}

          <section className="recent">

            <div className="section-top">

              <div>

                <span className="section-label">
                  ACTIVITY
                </span>

                <h3>
                  Khảo sát gần đây
                </h3>

              </div>

              <span className="total-pill">
                {stats.total}
              </span>

            </div>


            {surveys.length === 0 ? (

              <div className="empty-card">

                <div className="empty-illustration">
                  📝
                </div>

                <h4>
                  Chưa có khảo sát nào
                </h4>

                <p>
                  Bấm “Bắt đầu khảo sát”
                  để tạo phiên đầu tiên.
                </p>

              </div>

            ) : (

              <div className="recent-list">

                {surveys.map(
                  (survey) => (

                    <div
                      className="recent-item"
                      key={
                        survey.sessionId
                      }
                    >

                      <div className="person-avatar">

                        {(
                          survey.interviewer ||
                          'S'
                        )
                          .charAt(0)
                          .toUpperCase()}

                      </div>


                      <div className="recent-info">

                        <strong>
                          {survey.interviewer ||
                            'Chưa nhập tên'}
                        </strong>

                        <span>
                          {survey.major ||
                            'Chưa chọn ngành'}

                          {' · '}

                          {survey.jobField ||
                            'Chưa chọn lĩnh vực'}
                        </span>

                        <small>
                          {new Date(
                            survey.createdAt,
                          ).toLocaleString(
                            'vi-VN',
                          )}
                        </small>

                      </div>


                      <div
                        className={`sync-badge ${
                          survey.status ===
                          'SYNCED'
                            ? 'badge-green'
                            : 'badge-orange'
                        }`}
                      >

                        {survey.status ===
                        'SYNCED'
                          ? '✓ Đã đồng bộ'
                          : '↑ Chờ đồng bộ'}

                      </div>

                    </div>

                  ),
                )}

              </div>

            )}

          </section>


          <footer>
            VKU Student Job Survey
          </footer>

        </main>

      </div>
    )
  }


  /* =====================================
     SURVEY
  ===================================== */

  return (
    <div className="app">

      <header className="topbar">

        <div className="topbar-inner">

          <button
            type="button"
            className="back-button"
            onClick={
              goHome
            }
          >
            ← Quay lại
          </button>


          <div
            className={`connection ${
              isOnline
                ? 'is-online'
                : 'is-offline'
            }`}
          >

            <span />

            {isOnline
              ? 'Online'
              : 'Offline'}

          </div>

        </div>

      </header>


      <main className="survey-page">

        <div className="survey-intro">

          <span className="eyebrow">
            NEW SURVEY
          </span>

          <h2>
            Khảo sát nhu cầu việc làm
          </h2>

          <p>
            Hoàn thành các thông tin dưới đây
            để ghi nhận một phiên khảo sát mới.
          </p>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          {/* 01 */}

          <section className="form-card">

            <div className="form-card-title">

              <span className="step">
                01
              </span>

              <div>

                <h3>
                  Thông tin phiên
                </h3>

                <p>
                  Được ghi nhận tự động
                </p>

              </div>

            </div>


            <div className="session-row">

              <div>

                <span>
                  SESSION ID
                </span>

                <strong>
                  {sessionId}
                </strong>

              </div>


              <div>

                <span>
                  THỜI GIAN
                </span>

                <strong>
                  {new Date().toLocaleString(
                    'vi-VN',
                  )}
                </strong>

              </div>

            </div>


            <div className="input-group">

              <label>
                Người phỏng vấn
                <i>*</i>
              </label>

              <input
                type="text"
                name="interviewer"
                value={
                  form.interviewer
                }
                onChange={
                  handleChange
                }
                placeholder="Nhập họ và tên người phỏng vấn"
                required
              />

            </div>

          </section>


          {/* 02 */}

          <section className="form-card">

            <div className="form-card-title">

              <span className="step">
                02
              </span>

              <div>

                <h3>
                  Thông tin sinh viên
                </h3>

                <p>
                  Thông tin học tập hiện tại
                </p>

              </div>

            </div>


            <div className="two-columns">

              <SelectField
                label="Ngành học"
                name="major"
                value={
                  form.major
                }
                onChange={
                  handleChange
                }
                options={[
                  'Công nghệ thông tin',
                  'Kỹ thuật máy tính',
                  'Kinh doanh',
                  'Marketing',
                  'Truyền thông đa phương tiện',
                  'Khác',
                ]}
              />


              <SelectField
                label="Năm học"
                name="year"
                value={
                  form.year
                }
                onChange={
                  handleChange
                }
                options={[
                  'Năm 1',
                  'Năm 2',
                  'Năm 3',
                  'Năm 4',
                ]}
              />

            </div>

          </section>


          {/* 03 */}

          <section className="form-card">

            <div className="form-card-title">

              <span className="step">
                03
              </span>

              <div>

                <h3>
                  Nhu cầu việc làm
                </h3>

                <p>
                  Định hướng nghề nghiệp
                </p>

              </div>

            </div>


            <SelectField
              label="Lĩnh vực mong muốn"
              name="jobField"
              value={
                form.jobField
              }
              onChange={
                handleChange
              }
              options={[
                'Software Developer',
                'Web Developer',
                'Mobile Developer',
                'Data / AI',
                'Cyber Security',
                'Business',
                'Marketing',
                'Thiết kế',
                'Khác',
              ]}
            />


            <div className="two-columns">

              <SelectField
                label="Hình thức làm việc"
                name="workType"
                value={
                  form.workType
                }
                onChange={
                  handleChange
                }
                options={[
                  'Full-time',
                  'Part-time',
                  'Internship',
                  'Freelance',
                  'Remote',
                ]}
              />


              <SelectField
                label="Mức thu nhập kỳ vọng"
                name="salary"
                value={
                  form.salary
                }
                onChange={
                  handleChange
                }
                options={[
                  'Dưới 5 triệu',
                  '5 - 10 triệu',
                  '10 - 15 triệu',
                  '15 - 20 triệu',
                  'Trên 20 triệu',
                ]}
              />

            </div>

          </section>


          {/* 04 */}

          <section className="form-card">

            <div className="form-card-title">

              <span className="step">
                04
              </span>

              <div>

                <h3>
                  Quan điểm cá nhân
                </h3>

                <p>
                  Tiêu chí và nhu cầu hỗ trợ
                </p>

              </div>

            </div>


            <div className="two-columns">

              <SelectField
                label="Tiêu chí quan trọng nhất"
                name="priority"
                value={
                  form.priority
                }
                onChange={
                  handleChange
                }
                options={[
                  'Thu nhập',
                  'Môi trường làm việc',
                  'Cơ hội phát triển',
                  'Địa điểm làm việc',
                  'Thời gian làm việc',
                  'Phúc lợi',
                ]}
              />


              <SelectField
                label="Nhu cầu hỗ trợ tìm việc"
                name="support"
                value={
                  form.support
                }
                onChange={
                  handleChange
                }
                options={[
                  'Có',
                  'Không',
                ]}
              />

            </div>


            <div className="input-group">

              <label>
                Ý kiến khác
              </label>

              <textarea
                name="other"
                value={
                  form.other
                }
                onChange={
                  handleChange
                }
                placeholder="Chia sẻ thêm nhu cầu hoặc mong muốn của bạn..."
              />

            </div>

          </section>


          {/* 05 */}

          <section className="form-card">

            <div className="form-card-title">

              <span className="step">
                05
              </span>

              <div>

                <h3>
                  Thông tin hiện trường
                </h3>

                <p>
                  GPS và hình ảnh khảo sát
                </p>

              </div>

            </div>


            <div className="location-row">

              <div className="location-icon">
                ⌖
              </div>


              <div className="location-text">

                <strong>
                  Vị trí hiện tại
                </strong>

                <span>
                  {location
                    ? `${location.latitude.toFixed(
                        6,
                      )}, ${location.longitude.toFixed(
                        6,
                      )}`
                    : 'Chưa lấy vị trí'}
                </span>

              </div>


              <button
                type="button"
                className="secondary-button"
                onClick={
                  getLocation
                }
              >
                Lấy GPS
              </button>

            </div>


            <label className="upload-box">

              {photo ? (

                <img
                  src={photo}
                  alt="Ảnh khảo sát"
                />

              ) : (

                <>
                  <div className="upload-icon">
                    ＋
                  </div>

                  <strong>
                    Thêm ảnh hiện trường
                  </strong>

                  <span>
                    Chạm để mở camera
                    hoặc chọn ảnh
                  </span>
                </>

              )}


              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={
                  handlePhoto
                }
              />

            </label>

          </section>


          {/* ACTIONS */}

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={
                goHome
              }
            >
              Hủy
            </button>


            <button
              type="submit"
              className="primary-button"
            >
              Lưu khảo sát

              <span>
                →
              </span>
            </button>

          </div>

        </form>

      </main>

    </div>
  )
}


function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div className="input-group">

      <label>
        {label}
        <i>*</i>
      </label>

      <select
        name={name}
        value={value}
        onChange={
          onChange
        }
        required
      >

        <option value="">
          Chọn {label.toLowerCase()}
        </option>

        {options.map(
          (option) => (
            <option
              value={option}
              key={option}
            >
              {option}
            </option>
          ),
        )}

      </select>

    </div>
  )
}


export default App