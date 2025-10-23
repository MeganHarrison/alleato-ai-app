# RAG Pipeline Refactoring - Implementation Tasks

## Task Breakdown for Bulletproof Implementation

### **Phase 1: Core Single-Run Implementation** 🚀 [HIGH PRIORITY]

#### **Task 1.1: Extract check_for_changes() method in Google Drive Watcher**
- **File**: `backend_rag_pipeline/Google_Drive/drive_watcher.py`
- **Action**: 
  - Extract core logic from `watch_for_changes()` infinite loop
  - Create new `check_for_changes()` method that returns statistics
  - Refactor `watch_for_changes()` to call `check_for_changes()` in loop
- **Return format**: `{"files_processed": int, "files_deleted": int, "errors": int, "duration": float}`
- **Test compatibility**: Ensure existing `test_watch_for_changes` still passes

#### **Task 1.2: Extract check_for_changes() method in Local Files Watcher**
- **File**: `backend_rag_pipeline/Local_Files/file_watcher.py`
- **Action**: Same pattern as Google Drive watcher
- **Test compatibility**: Ensure existing `test_watch_for_changes` still passes

#### **Task 1.3: Update Docker Entrypoint for Single-Run Mode**
- **File**: `backend_rag_pipeline/docker_entrypoint.py`
- **Action**: 
  - Complete the single-run mode implementation (currently just scaffolding)
  - Add proper exit codes (0=success, 1=retry, 2=config error, 3=auth error)
  - Add statistics logging for monitoring
  - Ensure proper initialization and cleanup

#### **Task 1.4: Add single-run mode tests**
- **Files**: 
  - `backend_rag_pipeline/Google_Drive/tests/test_drive_watcher.py`
  - `backend_rag_pipeline/Local_Files/tests/test_file_watcher.py`
- **Action**: Add parameterized tests for both continuous and single modes

---

### **Phase 2: Google Drive Service Account Authentication** 🔐 [HIGH PRIORITY]

#### **Task 2.1: Implement Service Account Authentication**
- **File**: `backend_rag_pipeline/Google_Drive/drive_watcher.py`
- **Action**:
  - Add support for `GOOGLE_DRIVE_CREDENTIALS_JSON` environment variable
  - Implement service account credential loading
  - Maintain backward compatibility with file-based credentials
  - Update `authenticate_google_drive()` method

#### **Task 2.2: Update Google Drive API Client Initialization**
- **File**: `backend_rag_pipeline/Google_Drive/drive_watcher.py`
- **Action**:
  - Modify `build('drive', 'v3', credentials=creds)` to use service account
  - Remove interactive OAuth2 flow when using service account
  - Add proper error handling for credential parsing

#### **Task 2.3: Add Service Account Tests**
- **File**: `backend_rag_pipeline/Google_Drive/tests/test_drive_watcher.py`
- **Action**: Add tests for service account authentication path

---

### **Phase 3: Database State Management & Environment Configuration** 💾 [MEDIUM PRIORITY]

#### **Task 3.1: Create Database Schema**
- **File**: `backend_rag_pipeline/sql/9-rag_pipeline_state.sql` (new file)
- **Action**: Create the `rag_pipeline_state` table schema

#### **Task 3.2: Implement Database State Manager**
- **File**: `backend_rag_pipeline/common/state_manager.py` (new file)
- **Action**:
  - Create `StateManager` class for database state operations
  - Methods: `load_state()`, `save_state()`, `get_pipeline_state()`, `update_pipeline_state()`
  - Handle `RAG_PIPELINE_ID` environment variable
  - Graceful fallback to file-based state for backward compatibility

#### **Task 3.3: Update Watchers to Use Database State**
- **Files**: 
  - `backend_rag_pipeline/Google_Drive/drive_watcher.py`
  - `backend_rag_pipeline/Local_Files/file_watcher.py`
- **Action**:
  - Integrate `StateManager` for `last_check_time` and `known_files`
  - Update initialization to load from database if `RAG_PIPELINE_ID` is set
  - Update state saving after processing

#### **Task 3.4: Implement Environment Variable Configuration**
- **Files**: Both watcher files
- **Action**:
  - Add environment variable parsing for config overrides
  - Priority: env vars > config.json > defaults
  - Support: `RAG_WATCH_FOLDER_ID`, `RAG_WATCH_DIRECTORY`, `GOOGLE_DRIVE_CREDENTIALS_JSON`

#### **Task 3.5: Update .env.example**
- **File**: `backend_rag_pipeline/.env.example`
- **Action**: Add all new environment variables with proper documentation

#### **Task 3.6: Database State Tests**
- **File**: `backend_rag_pipeline/tests/test_state_manager.py` (new file)
- **Action**: Comprehensive tests for database state management

---

### **Phase 4: New Tests for Single-Run Mode** 🧪 [MEDIUM PRIORITY]

#### **Task 4.1: Docker Entrypoint Tests**
- **File**: `backend_rag_pipeline/tests/test_docker_entrypoint.py` (new file)
- **Action**: Test mode routing, exit codes, error handling

#### **Task 4.2: Integration Tests for Single-Run Mode**
- **File**: `backend_rag_pipeline/tests/test_integration_single_run.py` (new file)
- **Action**: End-to-end tests for single-run pipeline execution

#### **Task 4.3: Service Account Integration Tests**
- **File**: `backend_rag_pipeline/Google_Drive/tests/test_service_account.py` (new file)
- **Action**: Test service account credential loading and authentication

#### **Task 4.4: Update Existing Tests for Compatibility**
- **Files**: All existing test files
- **Action**: Ensure all existing tests pass with new functionality

---

### **Phase 5: Final Validation & Testing** ✅ [HIGH PRIORITY]

#### **Task 5.1: Run Complete Test Suite**
- **Action**: Execute all tests and ensure 100% pass rate
- **Command**: `pytest backend_rag_pipeline/tests/ -v`

#### **Task 5.2: Manual Testing**
- **Action**: Test both continuous and single-run modes manually
- **Scenarios**: New files, updated files, deleted files, error conditions

#### **Task 5.3: Docker Container Testing**
- **Action**: Test containerized execution with both modes
- **Verify**: Exit codes, statistics output, state persistence

---

## **Implementation Quality Standards**

### **Code Quality Requirements**
- ✅ **100% backward compatibility** - All existing functionality preserved
- ✅ **Comprehensive error handling** - Proper exception handling and logging
- ✅ **Type hints** - All new methods include proper type annotations
- ✅ **Documentation** - Docstrings for all new methods and classes
- ✅ **Logging** - Structured logging for debugging and monitoring

### **Testing Requirements**
- ✅ **100% test coverage** for new functionality
- ✅ **All existing tests pass** without modification
- ✅ **Integration tests** for new features
- ✅ **Error scenario testing** - Test failure modes and recovery
- ✅ **Mock isolation** - Proper mocking of external dependencies

### **Performance Requirements**
- ✅ **Cold start optimization** - Single-run mode starts quickly
- ✅ **Memory efficiency** - No memory leaks in either mode
- ✅ **Database efficiency** - Minimal database calls for state management
- ✅ **Error recovery** - Graceful handling of transient failures

### **Security Requirements**
- ✅ **Credential security** - Service account keys handled securely
- ✅ **Environment variable validation** - Proper validation of inputs
- ✅ **Database security** - Parameterized queries, no SQL injection risks
- ✅ **Error disclosure** - No credential leakage in error messages

---

## **Dependencies & Prerequisites**

### **New Dependencies** (if any)
- `google-auth` (likely already installed)
- `google-auth-oauthlib` (for service account support)

### **Database Changes**
- New table: `rag_pipeline_state`
- SQL script: `sql/9-rag_pipeline_state.sql`

### **Environment Variables**
- `RAG_PIPELINE_ID` (new)
- `GOOGLE_DRIVE_CREDENTIALS_JSON` (new)
- `RUN_MODE` (updated docker entrypoint usage)

---

## **Success Criteria**

### **Functional Success**
- ✅ Continuous mode works exactly as before
- ✅ Single-run mode executes one complete cycle and exits
- ✅ Service account authentication works in cloud environments
- ✅ Database state persistence works across runs
- ✅ All existing tests pass without modification

### **Quality Success**
- ✅ Zero regressions in existing functionality
- ✅ Clean, maintainable, well-documented code
- ✅ Comprehensive test coverage for new features
- ✅ Proper error handling and logging
- ✅ Production-ready cloud deployment capability

This implementation plan ensures bulletproof delivery with zero compromise on quality or functionality.